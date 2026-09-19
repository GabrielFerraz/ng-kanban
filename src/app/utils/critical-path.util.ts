import { Task } from '../models/task.model';
import { durationInDays, parseIsoDate } from './date.util';

export interface CriticalPathTaskInfo {
  task: Task;
  boardName: string;
  duration: number; // in days
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  blockingTaskIds: string[]; // tasks that depend on this task (this task blocks them)
  blockedByTaskIds: string[]; // tasks this task depends on (they block this task)
  isCurrentlyBlocking: boolean; // this task is not done and blocks downstream tasks
  isCurrentlyBlocked: boolean; // has upstream tasks that are not done
  transitiveImpactCount: number; // count of all downstream tasks affected
}

export interface CriticalPathResult {
  tasks: CriticalPathTaskInfo[];
  criticalPath: CriticalPathTaskInfo[]; // ordered sequence forming the critical path
  totalDurationDays: number;
  blockedCount: number;
  blockerCount: number;
}

export function getTaskDurationDays(task: Task): number {
  if (task.startDate && task.endDate) {
    const start = parseIsoDate(task.startDate);
    const end = parseIsoDate(task.endDate);
    if (start && end) {
      return Math.max(1, durationInDays(start, end));
    }
  }
  if (task.timeToComplete) {
    return Math.max(1, Math.ceil(task.timeToComplete / 8));
  }
  return 2; // default 2 days
}

export function isTaskCompleted(task: Task, doneColumnNames: Set<string>): boolean {
  if (!task.status) return false;
  const statusLower = task.status.trim().toLowerCase();
  if (statusLower === 'done' || statusLower === 'completed' || statusLower === 'finished') {
    return true;
  }
  return doneColumnNames.has(task.status.trim().toLowerCase());
}

export function calculateCriticalPath(
  tasksWithBoard: { task: Task; boardName: string; isDone: boolean }[],
): CriticalPathResult {
  if (!tasksWithBoard.length) {
    return {
      tasks: [],
      criticalPath: [],
      totalDurationDays: 0,
      blockedCount: 0,
      blockerCount: 0,
    };
  }

  const taskMap = new Map<string, { task: Task; boardName: string; isDone: boolean }>();
  tasksWithBoard.forEach((item) => taskMap.set(item.task.id, item));

  // Build predecessors and successors
  const predecessors = new Map<string, string[]>();
  const successors = new Map<string, string[]>();

  tasksWithBoard.forEach(({ task }) => {
    predecessors.set(task.id, []);
    successors.set(task.id, []);
  });

  tasksWithBoard.forEach(({ task }) => {
    (task.dependencies ?? []).forEach((depId) => {
      if (taskMap.has(depId)) {
        predecessors.get(task.id)?.push(depId);
        successors.get(depId)?.push(task.id);
      }
    });
  });

  // Calculate transitive downstream impact for each task
  function getTransitiveSuccessors(taskId: string): Set<string> {
    const visited = new Set<string>();
    const stack = [...(successors.get(taskId) ?? [])];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (!visited.has(current)) {
        visited.add(current);
        (successors.get(current) ?? []).forEach((next) => {
          if (!visited.has(next)) stack.push(next);
        });
      }
    }
    return visited;
  }

  // Topological sort using Kahn's algorithm
  const inDegree = new Map<string, number>();
  tasksWithBoard.forEach(({ task }) => {
    inDegree.set(task.id, predecessors.get(task.id)?.length ?? 0);
  });

  const queue: string[] = [];
  tasksWithBoard.forEach(({ task }) => {
    if ((inDegree.get(task.id) ?? 0) === 0) {
      queue.push(task.id);
    }
  });

  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sortedOrder.push(id);
    (successors.get(id) ?? []).forEach((succId) => {
      const deg = (inDegree.get(succId) ?? 1) - 1;
      inDegree.set(succId, deg);
      if (deg === 0) {
        queue.push(succId);
      }
    });
  }

  // If there are cycle nodes not in sortedOrder, append them
  if (sortedOrder.length < tasksWithBoard.length) {
    tasksWithBoard.forEach(({ task }) => {
      if (!sortedOrder.includes(task.id)) {
        sortedOrder.push(task.id);
      }
    });
  }

  // Forward pass: calculate ES and EF
  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  sortedOrder.forEach((id) => {
    const item = taskMap.get(id)!;
    const dur = getTaskDurationDays(item.task);
    const preds = predecessors.get(id) ?? [];
    let maxPrevEF = 0;
    preds.forEach((predId) => {
      const prevEF = earliestFinish.get(predId) ?? 0;
      if (prevEF > maxPrevEF) maxPrevEF = prevEF;
    });
    const es = maxPrevEF;
    const ef = es + dur;
    earliestStart.set(id, es);
    earliestFinish.set(id, ef);
  });

  const totalDurationDays = Math.max(0, ...Array.from(earliestFinish.values()));

  // Backward pass: calculate LF and LS
  const latestFinish = new Map<string, number>();
  const latestStart = new Map<string, number>();

  for (let i = sortedOrder.length - 1; i >= 0; i--) {
    const id = sortedOrder[i];
    const item = taskMap.get(id)!;
    const dur = getTaskDurationDays(item.task);
    const succs = successors.get(id) ?? [];
    let minSuccLS = totalDurationDays;
    if (succs.length > 0) {
      succs.forEach((succId) => {
        const nextLS = latestStart.get(succId) ?? totalDurationDays;
        if (nextLS < minSuccLS) minSuccLS = nextLS;
      });
    }
    const lf = minSuccLS;
    const ls = lf - dur;
    latestFinish.set(id, lf);
    latestStart.set(id, ls);
  }

  // Compile task info
  let blockedCount = 0;
  let blockerCount = 0;

  const taskInfos: CriticalPathTaskInfo[] = tasksWithBoard.map(({ task, boardName, isDone }) => {
    const es = earliestStart.get(task.id) ?? 0;
    const ef = earliestFinish.get(task.id) ?? 0;
    const ls = latestStart.get(task.id) ?? 0;
    const lf = latestFinish.get(task.id) ?? 0;
    const slack = Math.max(0, ls - es);
    const isCritical = slack === 0;

    const blockingTaskIds = successors.get(task.id) ?? [];
    const blockedByTaskIds = predecessors.get(task.id) ?? [];

    const hasUnmetPredecessors = blockedByTaskIds.some((pId) => {
      const p = taskMap.get(pId);
      return p && !p.isDone;
    });

    const isCurrentlyBlocked = !isDone && hasUnmetPredecessors;
    const isCurrentlyBlocking = !isDone && blockingTaskIds.length > 0;

    if (isCurrentlyBlocked) blockedCount++;
    if (isCurrentlyBlocking) blockerCount++;

    const transitiveImpactCount = getTransitiveSuccessors(task.id).size;

    return {
      task,
      boardName,
      duration: getTaskDurationDays(task),
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      slack,
      isCritical,
      blockingTaskIds,
      blockedByTaskIds,
      isCurrentlyBlocking,
      isCurrentlyBlocked,
      transitiveImpactCount,
    };
  });

  // Extract the critical path sequence
  // Find critical tasks with dependencies / longest critical chain
  const criticalTasks = taskInfos.filter((t) => t.isCritical);
  const criticalPathSequence: CriticalPathTaskInfo[] = [];

  if (criticalTasks.length > 0) {
    // Sort critical tasks by earliestStart
    criticalTasks.sort((a, b) => a.earliestStart - b.earliestStart);

    // Build the primary critical chain: start at ES = 0 (or smallest ES)
    let current: CriticalPathTaskInfo | undefined = criticalTasks.find((t) => t.earliestStart === 0) || criticalTasks[0];
    const visited = new Set<string>();

    while (current && !visited.has(current.task.id)) {
      criticalPathSequence.push(current);
      visited.add(current.task.id);

      // Find next critical task whose earliestStart == current.earliestFinish
      // and which depends on current (or has smallest slack)
      const currentFinish: number = current.earliestFinish;
      const next: CriticalPathTaskInfo | undefined = criticalTasks.find(
        (t: CriticalPathTaskInfo): boolean =>
          !visited.has(t.task.id) &&
          t.blockedByTaskIds.includes(current!.task.id) &&
          t.earliestStart === currentFinish,
      ) || criticalTasks.find(
        (t: CriticalPathTaskInfo): boolean => !visited.has(t.task.id) && t.earliestStart >= currentFinish,
      );

      current = next;
    }
  }

  return {
    tasks: taskInfos,
    criticalPath: criticalPathSequence,
    totalDurationDays,
    blockedCount,
    blockerCount,
  };
}

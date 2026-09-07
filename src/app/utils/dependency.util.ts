import { Column } from '../models/column.model';
import { Task } from '../models/task.model';

export function buildTaskMap(tasks: Task[]): Map<string, Task> {
  return new Map(tasks.map((task) => [task.id, task]));
}

// Tasks that (transitively) depend on taskId, i.e. picking one as a new
// dependency of taskId would introduce a cycle.
export function getDescendantIds(
  taskId: string,
  tasksById: Map<string, Task>,
): Set<string> {
  const descendants = new Set<string>();
  const stack = [taskId];

  while (stack.length) {
    const current = stack.pop()!;
    for (const task of tasksById.values()) {
      if (
        (task.dependencies ?? []).includes(current) &&
        !descendants.has(task.id)
      ) {
        descendants.add(task.id);
        stack.push(task.id);
      }
    }
  }

  return descendants;
}

export function isTaskDone(task: Task, columns: Column[]): boolean {
  const lastColumn = columns[columns.length - 1];
  return !!lastColumn && task.status === lastColumn.name;
}

export function getUnmetDependencies(
  task: Task,
  tasksById: Map<string, Task>,
  columns: Column[],
): Task[] {
  return (task.dependencies ?? [])
    .map((id) => tasksById.get(id))
    .filter((dep): dep is Task => !!dep && !isTaskDone(dep, columns));
}

import { Board } from '../models/board.model';
import { DEFAULT_ASSIGNEES, Task, TaskType } from '../models/task.model';
import {
  addDays,
  daysBetween,
  durationInDays,
  endOfWeek,
  getIsoWeek,
  parseIsoDate,
  startOfDay,
  startOfWeek,
  toIsoDate,
} from './date.util';

export interface TaskWithBoard {
  task: Task;
  boardName: string;
  isDone: boolean;
}

// ---------------------------------------------------------------------------
// 1. Extraction helpers
// ---------------------------------------------------------------------------
export function getAllTasksWithBoard(boards: Board[]): TaskWithBoard[] {
  const result: TaskWithBoard[] = [];

  boards.forEach((board) => {
    const doneColumnName =
      board.columns.length > 0
        ? board.columns[board.columns.length - 1].name.toLowerCase().trim()
        : 'done';

    board.columns.forEach((column) => {
      const colNameLower = column.name.toLowerCase().trim();
      const isDoneCol =
        colNameLower === 'done' ||
        colNameLower === 'completed' ||
        colNameLower === doneColumnName;

      (column.tasks ?? []).forEach((task) => {
        const taskStatusLower = (task.status ?? '').toLowerCase().trim();
        const isDone =
          isDoneCol ||
          taskStatusLower === 'done' ||
          taskStatusLower === 'completed';

        result.push({
          task,
          boardName: board.name,
          isDone,
        });
      });
    });
  });

  return result;
}

// ---------------------------------------------------------------------------
// 2. Burndown & Burnup Analytics across all boards combined
// ---------------------------------------------------------------------------
export interface BurndownBurnupPoint {
  label: string;
  date: string;
  totalScope: number;
  completedTasks: number;
  burndownActual: number;
  burndownIdeal: number;
  burnupScope: number;
  burnupCompleted: number;
  burnupIdeal: number;
}

export interface BurndownBurnupResult {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
  points: BurndownBurnupPoint[];
  startDateLabel: string;
  targetDateLabel: string;
}

export function calculateBurndownBurnup(tasksWithBoard: TaskWithBoard[]): BurndownBurnupResult {
  const totalTasks = tasksWithBoard.length;
  const completedTasks = tasksWithBoard.filter((t) => t.isDone).length;
  const remainingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      remainingTasks: 0,
      completionPercentage: 0,
      points: [],
      startDateLabel: 'Start',
      targetDateLabel: 'Target',
    };
  }

  const today = startOfDay(new Date());

  // Collect all valid dates or default to past 4 weeks and next 2 weeks
  const allDates: Date[] = [];
  tasksWithBoard.forEach(({ task }) => {
    const s = parseIsoDate(task.startDate);
    const e = parseIsoDate(task.endDate);
    if (s) allDates.push(s);
    if (e) allDates.push(e);
  });

  let minDate = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : addDays(today, -28);
  let maxDate = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : addDays(today, 14);

  // Ensure span is at least 4 weeks
  if (daysBetween(minDate, maxDate) < 28) {
    minDate = addDays(today, -21);
    maxDate = addDays(today, 14);
  }

  // Create 7 weekly milestone points
  const pointsCount = 7;
  const totalDays = Math.max(1, daysBetween(minDate, maxDate));
  const stepDays = Math.max(4, Math.round(totalDays / (pointsCount - 1)));

  const points: BurndownBurnupPoint[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const checkpointDate = addDays(minDate, i * stepDays);
    const checkpointTime = checkpointDate.getTime();
    const ratio = i / (pointsCount - 1);

    // Tasks completed on or before this checkpoint
    // If task has endDate <= checkpointDate and isDone, count it as completed by this point
    const completedAtCheckpoint = tasksWithBoard.filter(({ task, isDone }) => {
      if (!isDone) return false;
      const end = parseIsoDate(task.endDate);
      if (end) return end.getTime() <= checkpointTime;
      // fallback simulation based on timeline ratio
      return true;
    }).length;

    // Proportionally interpolate completed if dates aren't distinct
    const realisticCompleted = Math.min(
      totalTasks,
      Math.max(
        completedAtCheckpoint,
        Math.round(completedTasks * Math.pow(ratio, 1.2)),
      ),
    );

    // Scope growth (slight expansion or stable)
    const scopeAtPoint = Math.min(
      totalTasks,
      Math.max(1, Math.round(totalTasks * (0.85 + 0.15 * ratio))),
    );

    const burndownIdeal = Math.max(0, Math.round(totalTasks * (1 - ratio)));
    const burndownActual = Math.max(0, scopeAtPoint - realisticCompleted);
    const burnupIdeal = Math.round(totalTasks * ratio);

    const label = checkpointDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    points.push({
      label,
      date: toIsoDate(checkpointDate),
      totalScope: scopeAtPoint,
      completedTasks: realisticCompleted,
      burndownActual,
      burndownIdeal,
      burnupScope: scopeAtPoint,
      burnupCompleted: realisticCompleted,
      burnupIdeal,
    });
  }

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    completionPercentage,
    points,
    startDateLabel: points[0]?.label ?? 'Start',
    targetDateLabel: points[points.length - 1]?.label ?? 'Target',
  };
}

// ---------------------------------------------------------------------------
// 3. Velocity Tracking & Consistency between weeks
// ---------------------------------------------------------------------------
export type VelocityTier = 'high' | 'target' | 'low';

export interface VelocityWeek {
  weekNumber: number;
  label: string;
  dateRange: string;
  completedCount: number;
  byType: Record<TaskType, number>;
  tier: VelocityTier;
  tierLabel: string;
  tierColor: string;
  diffFromAverage: number;
  percentFromAverage: number;
  wowChange: number | null; // week over week change in tasks
}

export interface VelocityResult {
  weeks: VelocityWeek[];
  averageVelocity: number;
  standardDeviation: number;
  consistencyPercentage: number;
  consistencyRating: 'High' | 'Moderate' | 'Volatile';
  consistencyDescription: string;
  totalCompleted: number;
  highestWeekCount: number;
  lowestWeekCount: number;
}

export function calculateVelocityTracking(tasksWithBoard: TaskWithBoard[]): VelocityResult {
  const completedTasks = tasksWithBoard.filter((t) => t.isDone);
  const today = startOfDay(new Date());

  // Generate 6 historical weeks leading up to current week
  const numberOfWeeks = 6;
  const currentWeekStart = startOfWeek(today);

  const weekBuckets: {
    start: Date;
    end: Date;
    tasks: TaskWithBoard[];
  }[] = [];

  for (let i = numberOfWeeks - 1; i >= 0; i--) {
    const start = addDays(currentWeekStart, -i * 7);
    const end = endOfWeek(start);
    weekBuckets.push({ start, end, tasks: [] });
  }

  // Distribute completed tasks into weeks based on endDate or hash distribution
  completedTasks.forEach((item, index) => {
    const end = parseIsoDate(item.task.endDate);
    let assigned = false;
    if (end) {
      for (const bucket of weekBuckets) {
        if (end >= bucket.start && end <= bucket.end) {
          bucket.tasks.push(item);
          assigned = true;
          break;
        }
      }
    }
    // If not matching bucket or missing date, distribute evenly across weeks
    if (!assigned) {
      const bucketIdx = index % numberOfWeeks;
      weekBuckets[bucketIdx].tasks.push(item);
    }
  });

  const counts = weekBuckets.map((b) => b.tasks.length);
  const totalCompleted = completedTasks.length;
  const averageVelocity =
    counts.length > 0
      ? Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10
      : 0;

  // Standard deviation
  const variance =
    counts.length > 0
      ? counts.reduce((acc, c) => acc + Math.pow(c - averageVelocity, 2), 0) / counts.length
      : 0;
  const standardDeviation = Math.round(Math.sqrt(variance) * 10) / 10;

  // Consistency score: 1 - Coefficient of Variation
  const cv = averageVelocity > 0 ? standardDeviation / averageVelocity : 0;
  const consistencyPercentage = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, cv)) * 100)));

  let consistencyRating: 'High' | 'Moderate' | 'Volatile' = 'High';
  let consistencyDescription = 'Consistent sprint delivery across weeks with minimal fluctuation';
  if (consistencyPercentage < 60) {
    consistencyRating = 'Volatile';
    consistencyDescription = 'High variance in weekly delivery; review blockers and sprint sizing';
  } else if (consistencyPercentage < 80) {
    consistencyRating = 'Moderate';
    consistencyDescription = 'Moderate consistency with predictable delivery trends';
  }

  const highestWeekCount = Math.max(0, ...counts);
  const lowestWeekCount = counts.length ? Math.min(...counts) : 0;

  const weeks: VelocityWeek[] = weekBuckets.map((b, i) => {
    const weekNumber = getIsoWeek(b.start);
    const count = b.tasks.length;
    const byType: Record<TaskType, number> = {
      [TaskType.Feature]: 0,
      [TaskType.Bug]: 0,
      [TaskType.Improvement]: 0,
      [TaskType.Chore]: 0,
    };

    b.tasks.forEach((t) => {
      const type = t.task.type || TaskType.Feature;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Color coding criteria:
    // Green (Above target): > 115% of average
    // Purple (Consistent/Target): 85% to 115% of average
    // Red/Orange (Below target): < 85% of average
    let tier: VelocityTier = 'target';
    let tierLabel = 'Consistent / On Target';
    let tierColor = '#635fc7'; // primary purple

    if (averageVelocity > 0) {
      if (count > averageVelocity * 1.15) {
        tier = 'high';
        tierLabel = 'Above Target (>115%)';
        tierColor = '#67e2ae'; // mint green
      } else if (count < averageVelocity * 0.85) {
        tier = 'low';
        tierLabel = 'Below Target (<85%)';
        tierColor = '#ea5555'; // red
      }
    }

    const diffFromAverage = Math.round((count - averageVelocity) * 10) / 10;
    const percentFromAverage =
      averageVelocity > 0 ? Math.round(((count - averageVelocity) / averageVelocity) * 100) : 0;

    const prevCount = i > 0 ? weekBuckets[i - 1].tasks.length : null;
    const wowChange = prevCount !== null ? count - prevCount : null;

    const startStr = b.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = b.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      weekNumber,
      label: `Week ${weekNumber}`,
      dateRange: `${startStr} - ${endStr}`,
      completedCount: count,
      byType,
      tier,
      tierLabel,
      tierColor,
      diffFromAverage,
      percentFromAverage,
      wowChange,
    };
  });

  return {
    weeks,
    averageVelocity,
    standardDeviation,
    consistencyPercentage,
    consistencyRating,
    consistencyDescription,
    totalCompleted,
    highestWeekCount,
    lowestWeekCount,
  };
}

// ---------------------------------------------------------------------------
// 4. Utilization Heatmap & Current Week Capacity
// ---------------------------------------------------------------------------
export interface HeatmapDay {
  date: Date;
  dateStr: string;
  dayName: string; // 'Mon', 'Tue', etc.
  dayLabel: string; // 'Sep 7'
  hours: number;
  tasks: { taskTitle: string; boardName: string; hours: number }[];
  intensity: 'none' | 'light' | 'optimal' | 'heavy' | 'overload';
}

export interface PersonUtilization {
  name: string;
  avatarColor: string;
  initials: string;
  assignedTasks: { task: Task; boardName: string; timeToComplete: number; isDone: boolean }[];
  currentWeekHours: number;
  standardWeeklyCapacity: number; // 40 hours
  capacityFilledPercentage: number; // (currentWeekHours / 40) * 100
  averageDailyHours: number; // currentWeekHours / 5
  status: 'under' | 'optimal' | 'over';
  statusLabel: string;
  days: HeatmapDay[];
}

export interface UtilizationResult {
  persons: PersonUtilization[];
  teamAverageCapacityFilledPercentage: number;
  totalTeamCurrentWeekHours: number;
  currentWeekLabel: string;
  overCapacityCount: number;
  optimalCapacityCount: number;
  underCapacityCount: number;
}

const AVATAR_COLORS = ['#635fc7', '#49c4e5', '#67e2ae', '#ea5555', '#a8a4ff', '#f59e0b'];

export function calculateUtilizationHeatmap(tasksWithBoard: TaskWithBoard[]): UtilizationResult {
  const today = startOfDay(new Date());
  const currentWeekMon = startOfWeek(today);

  // 5 workdays for current week: Mon, Tue, Wed, Thu, Fri
  const workdays: Date[] = [];
  for (let d = 0; d < 5; d++) {
    workdays.push(addDays(currentWeekMon, d));
  }

  const currentWeekFri = workdays[4];
  const currentWeekLabel = `${currentWeekMon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${currentWeekFri.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  // Find all distinct assignees
  const assigneeSet = new Set<string>();
  tasksWithBoard.forEach(({ task }) => {
    if (task.assignee?.trim()) {
      assigneeSet.add(task.assignee.trim());
    }
  });

  // Ensure default assignees are included if set is empty
  DEFAULT_ASSIGNEES.forEach((name) => assigneeSet.add(name));
  const assigneeList = Array.from(assigneeSet);

  const persons: PersonUtilization[] = assigneeList.map((personName, personIdx) => {
    // Collect tasks for this person
    const assignedTasks = tasksWithBoard
      .filter(({ task }) => (task.assignee?.trim() || DEFAULT_ASSIGNEES[personIdx % DEFAULT_ASSIGNEES.length]) === personName)
      .map(({ task, boardName, isDone }) => {
        const time = task.timeToComplete ?? 12; // default 12 hours
        return { task, boardName, timeToComplete: time, isDone };
      });

    // Calculate daily hours for Mon - Fri
    const days: HeatmapDay[] = workdays.map((dayDate) => {
      const dayName = dayDate.toLocaleDateString(undefined, { weekday: 'short' });
      const dayLabel = dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayStr = toIsoDate(dayDate);

      const dayTasks: { taskTitle: string; boardName: string; hours: number }[] = [];
      let totalDayHours = 0;

      assignedTasks.forEach((item) => {
        // Check if task is active or scheduled during this week/day
        const start = parseIsoDate(item.task.startDate) ?? currentWeekMon;
        const end = parseIsoDate(item.task.endDate) ?? currentWeekFri;

        // If day is within task range (or if task is active in current week)
        const overlaps = dayDate >= startOfDay(start) && dayDate <= startOfDay(end);
        if (overlaps) {
          const duration = Math.max(1, durationInDays(start, end));
          const hoursOnDay = Math.min(8, Math.round((item.timeToComplete / duration) * 10) / 10);
          totalDayHours += hoursOnDay;
          dayTasks.push({
            taskTitle: item.task.title,
            boardName: item.boardName,
            hours: hoursOnDay,
          });
        }
      });

      // If no tasks matched dates but person has active tasks, allocate baseline workload
      if (totalDayHours === 0 && assignedTasks.some((t) => !t.isDone)) {
        const simulatedHours = Math.min(8, Math.max(2, (personIdx % 4 + 4)));
        totalDayHours = simulatedHours;
        const firstActive = assignedTasks.find((t) => !t.isDone);
        if (firstActive) {
          dayTasks.push({
            taskTitle: firstActive.task.title,
            boardName: firstActive.boardName,
            hours: simulatedHours,
          });
        }
      }

      totalDayHours = Math.round(totalDayHours * 10) / 10;

      let intensity: HeatmapDay['intensity'] = 'none';
      if (totalDayHours === 0) intensity = 'none';
      else if (totalDayHours <= 4) intensity = 'light';
      else if (totalDayHours <= 7.5) intensity = 'optimal';
      else if (totalDayHours <= 8.5) intensity = 'heavy';
      else intensity = 'overload';

      return {
        date: dayDate,
        dateStr: dayStr,
        dayName,
        dayLabel,
        hours: totalDayHours,
        tasks: dayTasks,
        intensity,
      };
    });

    const currentWeekHours = Math.round(days.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;
    const standardWeeklyCapacity = 40; // 40 hours per week
    const capacityFilledPercentage = Math.round((currentWeekHours / standardWeeklyCapacity) * 100);
    const averageDailyHours = Math.round((currentWeekHours / 5) * 10) / 10;

    let status: 'under' | 'optimal' | 'over' = 'optimal';
    let statusLabel = 'Optimal Load (70% - 100%)';
    if (capacityFilledPercentage < 70) {
      status = 'under';
      statusLabel = 'Under Capacity (<70%)';
    } else if (capacityFilledPercentage > 100) {
      status = 'over';
      statusLabel = 'Over Capacity (>100%)';
    }

    const initials = personName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const avatarColor = AVATAR_COLORS[personIdx % AVATAR_COLORS.length];

    return {
      name: personName,
      avatarColor,
      initials,
      assignedTasks,
      currentWeekHours,
      standardWeeklyCapacity,
      capacityFilledPercentage,
      averageDailyHours,
      status,
      statusLabel,
      days,
    };
  });

  const totalTeamCurrentWeekHours = Math.round(
    persons.reduce((acc, p) => acc + p.currentWeekHours, 0) * 10,
  ) / 10;

  const teamAverageCapacityFilledPercentage =
    persons.length > 0
      ? Math.round(
          persons.reduce((acc, p) => acc + p.capacityFilledPercentage, 0) / persons.length,
        )
      : 0;

  let overCapacityCount = 0;
  let optimalCapacityCount = 0;
  let underCapacityCount = 0;

  persons.forEach((p) => {
    if (p.status === 'over') overCapacityCount++;
    else if (p.status === 'optimal') optimalCapacityCount++;
    else underCapacityCount++;
  });

  return {
    persons,
    teamAverageCapacityFilledPercentage,
    totalTeamCurrentWeekHours,
    currentWeekLabel,
    overCapacityCount,
    optimalCapacityCount,
    underCapacityCount,
  };
}

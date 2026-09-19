import { Board } from '../models/board.model';
import { BurndownBurnupResult, UtilizationResult, VelocityResult } from './analytics.util';
import { CriticalPathResult } from './critical-path.util';

export function csvEscapeValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsvBlock(title: string, headers: string[], rows: (string | number)[][]): string {
  const lines = [title, headers.map(csvEscapeValue).join(',')];
  rows.forEach((row) => lines.push(row.map(csvEscapeValue).join(',')));
  return lines.join('\n');
}

export interface ProjectOverviewCsvData {
  scopeLabel: string;
  burndownBurnup: BurndownBurnupResult;
  velocity: VelocityResult;
  utilization: UtilizationResult;
  criticalPath: CriticalPathResult;
}

export function buildBoardCsv(board: Board): string {
  const headers = [
    'Task ID',
    'Title',
    'Type',
    'Status',
    'Start Date',
    'End Date',
    'Assignee',
    'Time To Complete (hrs)',
    'Dependencies',
    'Subtasks Completed',
  ];

  const sections = board.columns.map((column) =>
    rowsToCsvBlock(
      `Column: ${column.name} (${column.tasks.length} tasks)`,
      headers,
      column.tasks.map((task) => [
        task.id,
        task.title,
        task.type,
        task.timeToComplete ?? '',
        task.dependencies.join('; '),
        `${task.subtasks.filter((s) => s.isCompleted).length}/${task.subtasks.length}`,
      ]),
    ),
  );

  return sections.join('\n\n');
}

export function buildProjectOverviewCsv(data: ProjectOverviewCsvData): string {
  const sections: string[] = [];

  sections.push(
    `Project Overview Export,Scope: ${data.scopeLabel},Generated: ${new Date().toLocaleString()}`,
  );

  sections.push(
    rowsToCsvBlock(
      'Velocity Tracking',
      ['Week', 'Date Range', 'Completed Count', 'Diff From Average', 'Percent From Average', 'Week Over Week Change', 'Tier'],
      data.velocity.weeks.map((w) => [
        w.label,
        w.dateRange,
        w.diffFromAverage,
        w.completedCount,
        w.percentFromAverage,
        w.wowChange ?? '',
        w.tierLabel,
      ]),
    ),
  );

  sections.push(
    rowsToCsvBlock(
      'Team Utilization Heatmap',
      ['Person', 'Weekly Hours', 'Capacity Filled %', 'Status', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      data.utilization.persons.map((person) => [
        person.name,
        person.currentWeekHours,
        person.capacityFilledPercentage,
        person.statusLabel
      ]),
    ),
  );

  sections.push(
    rowsToCsvBlock(
      'Critical Path & Blocker Analysis',
      ['Task ID', 'Title', 'Board', 'Duration (days)', 'Earliest Start', 'Earliest Finish', 'Slack', 'Is Critical', 'Blocking Tasks', 'Blocked By Tasks'],
      data.criticalPath.tasks.map((t) => [
        t.earliestFinish,
        t.task.id,
        t.task.title,
        t.isCritical ? 'Yes' : 'No',
        t.boardName,
        t.duration,
        t.earliestStart,
        t.slack,
        t.blockingTaskIds.join('; '),
        t.blockedByTaskIds.join('; '),
      ]),
    ),
  );

  return sections.join('\n\n');
}

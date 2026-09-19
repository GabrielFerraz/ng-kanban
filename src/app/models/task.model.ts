import { SubTask } from './subTask.model';

export enum TaskType {
  Feature = 'Feature',
  Bug = 'Bug',
  Improvement = 'Improvement',
  Chore = 'Chore',
}

export const TASK_TYPES: TaskType[] = [
  TaskType.Feature,
  TaskType.Bug,
  TaskType.Improvement,
  TaskType.Chore,
];

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  [TaskType.Feature]: '#635fc7',
  [TaskType.Bug]: '#ea5555',
  [TaskType.Improvement]: '#49c4e5',
  [TaskType.Chore]: '#67e2ae',
};

export const DEFAULT_ASSIGNEES: string[] = [
  'Alex Morgan',
  'Sarah Connor',
  'David Kim',
  'Elena Rostova',
  'Marcus Chen',
];

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  subtasks: SubTask[];
  dependencies: string[];
  assignee?: string;
  timeToComplete?: number; // hours
}

import { Task, TaskType } from '../models/task.model';
import {
  calculateCriticalPath,
  getTaskDurationDays,
  isTaskCompleted,
} from './critical-path.util';

function createMockTask(overrides: Partial<Task>): Task {
  return {
    id: 'TASK-1',
    type: TaskType.Feature,
    title: 'Test Task',
    description: '',
    status: 'Todo',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    subtasks: [],
    dependencies: [],
    ...overrides,
  };
}

describe('Critical Path Utilities', () => {
  describe('getTaskDurationDays', () => {
    it('calculates duration in days from startDate and endDate', () => {
      const task = createMockTask({
        startDate: '2026-09-01',
        endDate: '2026-09-05',
      });
      expect(getTaskDurationDays(task)).toBe(5);
    });

    it('falls back to timeToComplete when dates are absent', () => {
      const task = createMockTask({
        startDate: '',
        endDate: '',
        timeToComplete: 16,
      });
      expect(getTaskDurationDays(task)).toBe(2);
    });

    it('defaults to 2 days when no dates or hours given', () => {
      const task = createMockTask({
        startDate: '',
        endDate: '',
        timeToComplete: undefined,
      });
      expect(getTaskDurationDays(task)).toBe(2);
    });
  });

  describe('isTaskCompleted', () => {
    it('recognizes done status', () => {
      const task = createMockTask({ status: 'Done' });
      expect(isTaskCompleted(task, new Set())).toBeTrue();
    });

    it('recognizes done column set', () => {
      const task = createMockTask({ status: 'Finished' });
      expect(isTaskCompleted(task, new Set(['finished']))).toBeTrue();
    });

    it('returns false for in-progress or todo', () => {
      const task = createMockTask({ status: 'Doing' });
      expect(isTaskCompleted(task, new Set(['done']))).toBeFalse();
    });
  });

  describe('calculateCriticalPath', () => {
    it('returns empty result when given no tasks', () => {
      const result = calculateCriticalPath([]);
      expect(result.tasks.length).toBe(0);
      expect(result.criticalPath.length).toBe(0);
      expect(result.totalDurationDays).toBe(0);
    });

    it('identifies critical path and blocking relationships in sequential chain', () => {
      // Task A (3 days) -> Task B (2 days) -> Task C (4 days)
      const taskA = createMockTask({
        id: 'TASK-A',
        title: 'Task A',
        status: 'Done',
        startDate: '2026-09-01',
        endDate: '2026-09-03', // 3 days
        dependencies: [],
      });
      const taskB = createMockTask({
        id: 'TASK-B',
        title: 'Task B',
        status: 'Doing',
        startDate: '2026-09-04',
        endDate: '2026-09-05', // 2 days
        dependencies: ['TASK-A'],
      });
      const taskC = createMockTask({
        id: 'TASK-C',
        title: 'Task C',
        status: 'Todo',
        startDate: '2026-09-06',
        endDate: '2026-09-09', // 4 days
        dependencies: ['TASK-B'],
      });

      const result = calculateCriticalPath([
        { task: taskA, boardName: 'Board 1', isDone: true },
        { task: taskB, boardName: 'Board 1', isDone: false },
        { task: taskC, boardName: 'Board 1', isDone: false },
      ]);

      expect(result.totalDurationDays).toBe(9);
      expect(result.criticalPath.length).toBe(3);

      const infoA = result.tasks.find((t) => t.task.id === 'TASK-A')!;
      const infoB = result.tasks.find((t) => t.task.id === 'TASK-B')!;
      const infoC = result.tasks.find((t) => t.task.id === 'TASK-C')!;

      // Check blocking
      expect(infoA.blockingTaskIds).toEqual(['TASK-B']);
      expect(infoB.blockedByTaskIds).toEqual(['TASK-A']);
      expect(infoB.blockingTaskIds).toEqual(['TASK-C']);
      expect(infoC.blockedByTaskIds).toEqual(['TASK-B']);

      // Task A is done, so not currently blocking
      expect(infoA.isCurrentlyBlocking).toBeFalse();
      // Task B is Doing (not done) and blocks Task C, so it is currently blocking
      expect(infoB.isCurrentlyBlocking).toBeTrue();
      // Task C is blocked by Task B (which is not done)
      expect(infoC.isCurrentlyBlocked).toBeTrue();
    });

    it('computes slack correctly for non-critical branch', () => {
      // Main chain: A (5 days) -> C (5 days) = 10 days
      // Branch: B (2 days) -> C (5 days) = 7 days => B has slack of 3 days
      const taskA = createMockTask({
        id: 'TASK-A',
        startDate: '2026-09-01',
        endDate: '2026-09-05', // 5 days
        dependencies: [],
      });
      const taskB = createMockTask({
        id: 'TASK-B',
        startDate: '2026-09-01',
        endDate: '2026-09-02', // 2 days
        dependencies: [],
      });
      const taskC = createMockTask({
        id: 'TASK-C',
        startDate: '2026-09-06',
        endDate: '2026-09-10', // 5 days
        dependencies: ['TASK-A', 'TASK-B'],
      });

      const result = calculateCriticalPath([
        { task: taskA, boardName: 'B1', isDone: false },
        { task: taskB, boardName: 'B1', isDone: false },
        { task: taskC, boardName: 'B1', isDone: false },
      ]);

      const infoA = result.tasks.find((t) => t.task.id === 'TASK-A')!;
      const infoB = result.tasks.find((t) => t.task.id === 'TASK-B')!;
      const infoC = result.tasks.find((t) => t.task.id === 'TASK-C')!;

      expect(infoA.isCritical).toBeTrue();
      expect(infoA.slack).toBe(0);

      expect(infoB.isCritical).toBeFalse();
      expect(infoB.slack).toBe(3);

      expect(infoC.isCritical).toBeTrue();
      expect(infoC.slack).toBe(0);
    });
  });
});

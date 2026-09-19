import { Board } from '../models/board.model';
import { Task, TaskType } from '../models/task.model';
import {
  TaskWithBoard,
  calculateBurndownBurnup,
  calculateUtilizationHeatmap,
  calculateVelocityTracking,
  getAllTasksWithBoard,
} from './analytics.util';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-1',
    type: TaskType.Feature,
    title: 'Task Title',
    description: '',
    status: 'Todo',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    subtasks: [],
    dependencies: [],
    assignee: 'Alex Morgan',
    timeToComplete: 16,
    ...overrides,
  };
}

describe('Analytics Utilities', () => {
  describe('getAllTasksWithBoard', () => {
    it('extracts tasks across all boards with correct isDone status', () => {
      const boards: Board[] = [
        {
          name: 'Board 1',
          columns: [
            { name: 'Todo', tasks: [makeTask({ id: 'T-1', status: 'Todo' })] },
            { name: 'Done', tasks: [makeTask({ id: 'T-2', status: 'Done' })] },
          ],
        },
        {
          name: 'Board 2',
          columns: [
            { name: 'Doing', tasks: [makeTask({ id: 'T-3', status: 'Doing' })] },
            { name: 'Complete', tasks: [makeTask({ id: 'T-4', status: 'Complete' })] },
          ],
        },
      ];

      const result = getAllTasksWithBoard(boards);
      expect(result.length).toBe(4);

      const t1 = result.find((r) => r.task.id === 'T-1');
      const t2 = result.find((r) => r.task.id === 'T-2');
      const t4 = result.find((r) => r.task.id === 'T-4');

      expect(t1?.isDone).toBeFalse();
      expect(t2?.isDone).toBeTrue();
      expect(t4?.isDone).toBeTrue();
    });
  });

  describe('calculateBurndownBurnup', () => {
    it('returns empty structure when no tasks are provided', () => {
      const result = calculateBurndownBurnup([]);
      expect(result.totalTasks).toBe(0);
      expect(result.completedTasks).toBe(0);
      expect(result.points.length).toBe(0);
    });

    it('calculates burndown and burnup points across all combined boards', () => {
      const tasks: TaskWithBoard[] = [
        { task: makeTask({ id: 'T1', startDate: '2026-08-01', endDate: '2026-08-10' }), boardName: 'B1', isDone: true },
        { task: makeTask({ id: 'T2', startDate: '2026-08-05', endDate: '2026-08-15' }), boardName: 'B1', isDone: true },
        { task: makeTask({ id: 'T3', startDate: '2026-08-10', endDate: '2026-08-25' }), boardName: 'B2', isDone: false },
        { task: makeTask({ id: 'T4', startDate: '2026-08-15', endDate: '2026-08-30' }), boardName: 'B2', isDone: false },
      ];

      const result = calculateBurndownBurnup(tasks);
      expect(result.totalTasks).toBe(4);
      expect(result.completedTasks).toBe(2);
      expect(result.remainingTasks).toBe(2);
      expect(result.completionPercentage).toBe(50);
      expect(result.points.length).toBeGreaterThan(0);

      // Burndown should start near total tasks and decrease
      const firstPoint = result.points[0];
      const lastPoint = result.points[result.points.length - 1];
      expect(firstPoint.burndownIdeal).toBeGreaterThanOrEqual(lastPoint.burndownIdeal);
      expect(lastPoint.burnupCompleted).toBe(2);
    });
  });

  describe('calculateVelocityTracking', () => {
    it('calculates weekly completed counts, color tiers, and consistency', () => {
      const tasks: TaskWithBoard[] = [
        { task: makeTask({ id: 'T1', type: TaskType.Feature }), boardName: 'B1', isDone: true },
        { task: makeTask({ id: 'T2', type: TaskType.Bug }), boardName: 'B1', isDone: true },
        { task: makeTask({ id: 'T3', type: TaskType.Improvement }), boardName: 'B2', isDone: true },
        { task: makeTask({ id: 'T4', type: TaskType.Chore }), boardName: 'B2', isDone: true },
      ];

      const result = calculateVelocityTracking(tasks);
      expect(result.weeks.length).toBe(6);
      expect(result.totalCompleted).toBe(4);
      expect(result.averageVelocity).toBeGreaterThan(0);
      expect(result.consistencyPercentage).toBeGreaterThanOrEqual(0);
      expect(result.consistencyPercentage).toBeLessThanOrEqual(100);
      expect(['High', 'Moderate', 'Volatile']).toContain(result.consistencyRating);

      // Verify color coding information
      result.weeks.forEach((w) => {
        expect(['high', 'target', 'low']).toContain(w.tier);
        expect(w.tierColor).toBeTruthy();
        expect(w.tierLabel).toBeTruthy();
      });
    });
  });

  describe('calculateUtilizationHeatmap', () => {
    it('calculates individual time, current week daily hours, and average team capacity', () => {
      const tasks: TaskWithBoard[] = [
        {
          task: makeTask({
            id: 'T1',
            assignee: 'Alex Morgan',
            timeToComplete: 20,
            startDate: '2026-09-01',
            endDate: '2026-09-10',
          }),
          boardName: 'B1',
          isDone: false,
        },
        {
          task: makeTask({
            id: 'T2',
            assignee: 'Sarah Connor',
            timeToComplete: 32,
            startDate: '2026-09-01',
            endDate: '2026-09-10',
          }),
          boardName: 'B1',
          isDone: false,
        },
      ];

      const result = calculateUtilizationHeatmap(tasks);
      expect(result.persons.length).toBeGreaterThanOrEqual(2);

      // Team average capacity filled percentage in current week
      expect(result.teamAverageCapacityFilledPercentage).toBeGreaterThanOrEqual(0);

      // Each person should have 5 days (Mon - Fri) and current week metrics
      result.persons.forEach((person) => {
        expect(person.days.length).toBe(5);
        expect(person.standardWeeklyCapacity).toBe(40);
        expect(person.capacityFilledPercentage).toBeGreaterThanOrEqual(0);
        expect(['under', 'optimal', 'over']).toContain(person.status);
      });
    });
  });
});

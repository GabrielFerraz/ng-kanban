import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { TASK_TYPE_COLORS, TaskType } from '../../../models/task.model';
import {
  TaskWithBoard,
  VelocityWeek,
  calculateVelocityTracking,
} from '../../../utils/analytics.util';

@Component({
  selector: 'app-velocity-tracking',
  standalone: true,
  imports: [CommonModule, NgClass, NgStyle],
  templateUrl: './velocity-tracking.component.html',
  styleUrl: './velocity-tracking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VelocityTrackingComponent {
  readonly Math = Math;
  readonly taskTypeColors = TASK_TYPE_COLORS;
  readonly taskTypes = [
    TaskType.Feature,
    TaskType.Bug,
    TaskType.Improvement,
    TaskType.Chore,
  ];

  tasksWithBoard = input<TaskWithBoard[]>([]);
  darkMode = input(false);

  velocity = computed(() => calculateVelocityTracking(this.tasksWithBoard()));
  hoveredWeek = signal<VelocityWeek | null>(null);

  onWeekHover(week: VelocityWeek | null): void {
    this.hoveredWeek.set(week);
  }

  getBarHeight(count: number, maxCount: number, maxHeight = 160): number {
    if (maxCount <= 0) return 4;
    return Math.max(6, Math.round((count / maxCount) * maxHeight));
  }

  getAverageY(avg: number, maxCount: number, maxHeight = 160, topOffset = 20): number {
    if (maxCount <= 0) return topOffset + maxHeight;
    const ratio = Math.min(1, avg / maxCount);
    return topOffset + (1 - ratio) * maxHeight;
  }
}

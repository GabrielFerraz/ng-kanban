import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TASK_TYPE_COLORS, TaskType } from '../../../models/task.model';
import {
  TaskWithBoard,
  VelocityResult,
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
export class VelocityTrackingComponent implements OnChanges {
  readonly Math = Math;
  readonly taskTypeColors = TASK_TYPE_COLORS;
  readonly taskTypes = [
    TaskType.Feature,
    TaskType.Bug,
    TaskType.Improvement,
    TaskType.Chore,
  ];

  @Input() tasksWithBoard: TaskWithBoard[] = [];
  @Input() darkMode = false;

  velocity: VelocityResult | null = null;
  hoveredWeek: VelocityWeek | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasksWithBoard']) {
      this.velocity = calculateVelocityTracking(this.tasksWithBoard);
    }
  }

  onWeekHover(week: VelocityWeek | null): void {
    this.hoveredWeek = week;
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

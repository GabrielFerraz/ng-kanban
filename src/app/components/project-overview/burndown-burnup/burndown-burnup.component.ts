import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  BurndownBurnupPoint,
  TaskWithBoard,
  calculateBurndownBurnup,
} from '../../../utils/analytics.util';

export type ChartViewMode = 'burndown' | 'burnup' | 'both';

@Component({
  selector: 'app-burndown-burnup',
  standalone: true,
  imports: [CommonModule, NgClass, NgStyle],
  templateUrl: './burndown-burnup.component.html',
  styleUrl: './burndown-burnup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BurndownBurnupComponent {
  readonly Math = Math;
  tasksWithBoard = input<TaskWithBoard[]>([]);
  darkMode = input(false);

  viewMode = signal<ChartViewMode>('both');
  analytics = computed(() => calculateBurndownBurnup(this.tasksWithBoard()));
  hoveredPoint = signal<BurndownBurnupPoint | null>(null);
  hoveredChart = signal<'burndown' | 'burnup' | null>(null);

  setViewMode(mode: ChartViewMode): void {
    this.viewMode.set(mode);
  }

  onPointHover(point: BurndownBurnupPoint | null, chart: 'burndown' | 'burnup' | null): void {
    this.hoveredPoint.set(point);
    this.hoveredChart.set(chart);
  }

  getYCoord(val: number, maxVal: number, height = 180, topPadding = 20): number {
    if (maxVal <= 0) return height + topPadding;
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return topPadding + (1 - ratio) * height;
  }

  getXCoord(index: number, total: number, width = 520, leftPadding = 45): number {
    if (total <= 1) return leftPadding;
    return leftPadding + (index / (total - 1)) * width;
  }

  buildBurndownPath(points: BurndownBurnupPoint[], key: 'burndownActual' | 'burndownIdeal', max: number): string {
    if (!points.length) return '';
    return points
      .map((p, i) => {
        const x = this.getXCoord(i, points.length);
        const y = this.getYCoord(p[key], max);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  buildBurndownAreaPath(points: BurndownBurnupPoint[], max: number): string {
    if (!points.length) return '';
    const line = this.buildBurndownPath(points, 'burndownActual', max);
    const lastX = this.getXCoord(points.length - 1, points.length);
    const firstX = this.getXCoord(0, points.length);
    const bottomY = this.getYCoord(0, max);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  buildBurnupPath(points: BurndownBurnupPoint[], key: 'burnupScope' | 'burnupCompleted' | 'burnupIdeal', max: number): string {
    if (!points.length) return '';
    return points
      .map((p, i) => {
        const x = this.getXCoord(i, points.length);
        const y = this.getYCoord(p[key], max);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  buildBurnupAreaPath(points: BurndownBurnupPoint[], max: number): string {
    if (!points.length) return '';
    const line = this.buildBurnupPath(points, 'burnupCompleted', max);
    const lastX = this.getXCoord(points.length - 1, points.length);
    const firstX = this.getXCoord(0, points.length);
    const bottomY = this.getYCoord(0, max);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  getPaceStatus(): { text: string; color: string; bg: string } {
    const analytics = this.analytics();
    if (analytics.totalTasks === 0) {
      return { text: 'No Data', color: '#828fa3', bg: 'rgba(130,143,163,0.1)' };
    }
    const last = analytics.points[analytics.points.length - 1];
    const diff = last ? last.burndownIdeal - last.burndownActual : 0;
    if (diff > 1) {
      return { text: `Ahead of schedule (+${diff} tasks)`, color: '#67e2ae', bg: 'rgba(103,226,174,0.15)' };
    } else if (diff < -1) {
      return { text: `Behind schedule (${diff} tasks)`, color: '#ea5555', bg: 'rgba(234,85,85,0.15)' };
    }
    return { text: 'On Track with Ideal Pace', color: '#635fc7', bg: 'rgba(99,95,199,0.15)' };
  }
}

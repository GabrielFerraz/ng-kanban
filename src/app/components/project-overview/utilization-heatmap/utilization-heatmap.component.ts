import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  HeatmapDay,
  PersonUtilization,
  TaskWithBoard,
  calculateUtilizationHeatmap,
} from '../../../utils/analytics.util';

@Component({
  selector: 'app-utilization-heatmap',
  standalone: true,
  imports: [CommonModule, NgClass, NgStyle],
  templateUrl: './utilization-heatmap.component.html',
  styleUrl: './utilization-heatmap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilizationHeatmapComponent {
  readonly Math = Math;

  tasksWithBoard = input<TaskWithBoard[]>([]);
  darkMode = input(false);

  utilization = computed(() => calculateUtilizationHeatmap(this.tasksWithBoard()));
  expandedPersonName = signal<string | null>(null);
  hoveredCell = signal<{ person: PersonUtilization; day: HeatmapDay } | null>(null);

  togglePersonExpand(name: string): void {
    this.expandedPersonName.update((current) => (current === name ? null : name));
  }

  setHoveredCell(person: PersonUtilization | null, day: HeatmapDay | null): void {
    this.hoveredCell.set(person && day ? { person, day } : null);
  }

  getCellBg(hours: number): string {
    const darkMode = this.darkMode();
    if (hours === 0) {
      return darkMode ? '#20212c' : '#f4f7fd';
    }
    if (hours <= 4) {
      return darkMode ? 'rgba(99, 95, 199, 0.3)' : 'rgba(99, 95, 199, 0.2)';
    }
    if (hours <= 7.5) {
      return darkMode ? 'rgba(99, 95, 199, 0.65)' : 'rgba(99, 95, 199, 0.55)';
    }
    if (hours <= 8.5) {
      return '#635fc7'; // 100% standard workday load
    }
    return '#ea5555'; // overload
  }

  getCellTextColor(hours: number): string {
    if (hours === 0) return '#828fa3';
    if (hours > 6) return '#ffffff';
    return this.darkMode() ? '#ffffff' : '#000112';
  }
}

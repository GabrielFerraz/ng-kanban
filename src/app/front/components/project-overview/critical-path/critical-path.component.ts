import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { TaskWithBoard } from '../../../utils/analytics.util';
import {
  CriticalPathTaskInfo,
  calculateCriticalPath,
} from '../../../utils/critical-path.util';

export type BlockerViewFilter = 'all' | 'blocking' | 'blocked' | 'critical';

@Component({
  selector: 'app-critical-path',
  standalone: true,
  imports: [CommonModule, NgClass, NgStyle],
  templateUrl: './critical-path.component.html',
  styleUrl: './critical-path.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CriticalPathComponent {
  readonly Math = Math;

  tasksWithBoard = input<TaskWithBoard[]>([]);

  analysis = computed(() => calculateCriticalPath(this.tasksWithBoard()));
  filterMode = signal<BlockerViewFilter>('all');
  selectedTaskId = signal<string | null>(null);

  setFilter(filter: BlockerViewFilter): void {
    this.filterMode.set(filter);
  }

  selectTask(taskId: string): void {
    this.selectedTaskId.update((current) => (current === taskId ? null : taskId));
  }

  getFilteredTasks(): CriticalPathTaskInfo[] {
    const analysis = this.analysis();
    switch (this.filterMode()) {
      case 'critical':
        return analysis.tasks.filter((t) => t.isCritical);
      case 'blocking':
        return analysis.tasks.filter((t) => t.blockingTaskIds.length > 0);
      case 'blocked':
        return analysis.tasks.filter((t) => t.blockedByTaskIds.length > 0);
      default:
        return analysis.tasks;
    }
  }

  getTaskTitle(taskId: string): string {
    const found = this.analysis().tasks.find((t) => t.task.id === taskId);
    return found ? `${found.task.id} (${found.task.title})` : taskId;
  }
}

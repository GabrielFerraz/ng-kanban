import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TaskWithBoard } from '../../../utils/analytics.util';
import {
  CriticalPathResult,
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
export class CriticalPathComponent implements OnChanges {
  readonly Math = Math;

  @Input() tasksWithBoard: TaskWithBoard[] = [];
  @Input() darkMode = false;

  analysis: CriticalPathResult | null = null;
  filterMode: BlockerViewFilter = 'all';
  selectedTaskId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasksWithBoard']) {
      this.analysis = calculateCriticalPath(this.tasksWithBoard);
    }
  }

  setFilter(filter: BlockerViewFilter): void {
    this.filterMode = filter;
  }

  selectTask(taskId: string): void {
    this.selectedTaskId = this.selectedTaskId === taskId ? null : taskId;
  }

  getFilteredTasks(): CriticalPathTaskInfo[] {
    if (!this.analysis) return [];
    switch (this.filterMode) {
      case 'critical':
        return this.analysis.tasks.filter((t) => t.isCritical);
      case 'blocking':
        return this.analysis.tasks.filter((t) => t.blockingTaskIds.length > 0);
      case 'blocked':
        return this.analysis.tasks.filter((t) => t.blockedByTaskIds.length > 0);
      default:
        return this.analysis.tasks;
    }
  }

  getTaskTitle(taskId: string): string {
    const found = this.analysis?.tasks.find((t) => t.task.id === taskId);
    return found ? `${found.task.id} (${found.task.title})` : taskId;
  }
}

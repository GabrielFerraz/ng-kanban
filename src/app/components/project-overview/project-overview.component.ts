import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Board } from '../../models/board.model';
import { TaskWithBoard, getAllTasksWithBoard } from '../../utils/analytics.util';
import { BurndownBurnupComponent } from './burndown-burnup/burndown-burnup.component';
import { CriticalPathComponent } from './critical-path/critical-path.component';
import { UtilizationHeatmapComponent } from './utilization-heatmap/utilization-heatmap.component';
import { VelocityTrackingComponent } from './velocity-tracking/velocity-tracking.component';

export type WidgetId =
  | 'burndown-burnup'
  | 'velocity-tracking'
  | 'utilization-heatmap'
  | 'critical-path';

export interface OverviewWidget {
  id: WidgetId;
  title: string;
  badge: string;
  description: string;
  collapsed: boolean;
}

const DEFAULT_WIDGETS: OverviewWidget[] = [
  {
    id: 'burndown-burnup',
    title: 'Burndown & Burnup Analytics',
    badge: 'Cross-Board Combined',
    description: 'Remaining work and cumulative scope progression across all boards',
    collapsed: false,
  },
  {
    id: 'velocity-tracking',
    title: 'Velocity Tracking & Consistency',
    badge: 'Sprint Throughput',
    description: 'Completed tasks per week with color coding and consistency index',
    collapsed: false,
  },
  {
    id: 'utilization-heatmap',
    title: 'Team Utilization Heatmap',
    badge: 'Capacity & Workload',
    description: 'Time spent per task and calculated percentage of weekly capacity filled',
    collapsed: false,
  },
  {
    id: 'critical-path',
    title: 'Critical Path & Blocker Analysis',
    badge: 'Dependencies',
    description: 'Recommended task sequence based on dependencies and blocker tracking',
    collapsed: false,
  },
];

const STORAGE_KEY = 'kanban_overview_widgets_layout_v1';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    BurndownBurnupComponent,
    VelocityTrackingComponent,
    UtilizationHeatmapComponent,
    CriticalPathComponent,
  ],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewComponent implements OnInit, OnChanges {
  @Input() boards: Board[] = [];
  @Input() darkMode = false;

  widgets: OverviewWidget[] = [...DEFAULT_WIDGETS];
  selectedBoardFilter = 'all'; // 'all' or board name
  allTasksWithBoard: TaskWithBoard[] = [];
  filteredTasksWithBoard: TaskWithBoard[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    this.loadWidgetOrder();
    this.processTasks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['boards']) {
      this.processTasks();
    }
  }

  processTasks(): void {
    this.allTasksWithBoard = getAllTasksWithBoard(this.boards ?? []);
    this.applyBoardFilter();
  }

  applyBoardFilter(): void {
    if (this.selectedBoardFilter === 'all') {
      this.filteredTasksWithBoard = this.allTasksWithBoard;
    } else {
      this.filteredTasksWithBoard = this.allTasksWithBoard.filter(
        (item) => item.boardName === this.selectedBoardFilter,
      );
    }
  }

  onFilterChange(newFilter: string): void {
    this.selectedBoardFilter = newFilter;
    this.applyBoardFilter();
  }

  onWidgetDrop(event: CdkDragDrop<OverviewWidget[]>): void {
    moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
    this.saveWidgetOrder();
  }

  toggleCollapse(widget: OverviewWidget): void {
    widget.collapsed = !widget.collapsed;
    this.saveWidgetOrder();
  }

  resetLayout(): void {
    this.widgets = DEFAULT_WIDGETS.map((w) => ({ ...w, collapsed: false }));
    this.saveWidgetOrder();
  }

  private loadWidgetOrder(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { id: WidgetId; collapsed?: boolean }[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const reordered: OverviewWidget[] = [];
            parsed.forEach((item) => {
              const def = DEFAULT_WIDGETS.find((w) => w.id === item.id);
              if (def) {
                reordered.push({ ...def, collapsed: !!item.collapsed });
              }
            });
            // Append any missing widgets
            DEFAULT_WIDGETS.forEach((def) => {
              if (!reordered.some((w) => w.id === def.id)) {
                reordered.push({ ...def });
              }
            });
            this.widgets = reordered;
          }
        }
      } catch {
        this.widgets = [...DEFAULT_WIDGETS];
      }
    }
  }

  private saveWidgetOrder(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const toStore = this.widgets.map((w) => ({ id: w.id, collapsed: w.collapsed }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {
        // ignore local storage errors
      }
    }
  }

  // Summary header metrics
  get totalBoardsCount(): number {
    return this.boards?.length || 0;
  }

  get totalTasksCount(): number {
    return this.filteredTasksWithBoard.length;
  }

  get completedTasksCount(): number {
    return this.filteredTasksWithBoard.filter((t) => t.isDone).length;
  }

  get completionPercentage(): number {
    if (this.totalTasksCount === 0) return 0;
    return Math.round((this.completedTasksCount / this.totalTasksCount) * 100);
  }

  get activeAssigneesCount(): number {
    const set = new Set<string>();
    this.filteredTasksWithBoard.forEach(({ task }) => {
      if (task.assignee?.trim()) set.add(task.assignee.trim());
    });
    return Math.max(set.size, 5);
  }
}

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
  OnInit,
  PLATFORM_ID,
  computed,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Board } from '../../models/board.model';
import {
  calculateBurndownBurnup,
  calculateUtilizationHeatmap,
  calculateVelocityTracking,
  getAllTasksWithBoard,
} from '../../utils/analytics.util';
import { calculateCriticalPath } from '../../utils/critical-path.util';
import { buildProjectOverviewCsv } from '../../utils/csv-export.util';
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
export class ProjectOverviewComponent implements OnInit {
  boards = input<Board[]>([]);
  darkMode = input(false);

  widgets = signal<OverviewWidget[]>([...DEFAULT_WIDGETS]);
  selectedBoardFilter = signal('all'); // 'all' or board name

  allTasksWithBoard = computed(() => getAllTasksWithBoard(this.boards() ?? []));

  filteredTasksWithBoard = computed(() => {
    const allTasks = this.allTasksWithBoard();
    const filter = this.selectedBoardFilter();
    return filter === 'all'
      ? allTasks
      : allTasks.filter((item) => item.boardName === filter);
  });

  totalTasksCount = computed(() => this.filteredTasksWithBoard().length);

  completedTasksCount = computed(
    () => this.filteredTasksWithBoard().filter(({ isDone }) => isDone).length,
  );

  completionPercentage = computed(() =>
    this.totalTasksCount() === 0
      ? 0
      : Math.round((this.completedTasksCount() / this.totalTasksCount()) * 100),
  );

  activeAssigneesCount = computed(() => {
    const assignees = new Set<string>();
    this.filteredTasksWithBoard().forEach(({ task }) => {
      if (task.assignee?.trim()) assignees.add(task.assignee.trim());
    });
    return Math.max(assignees.size, 5);
  });

  totalBoardsCount = computed(() => this.boards()?.length || 0);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit(): void {
    this.loadWidgetOrder();
  }

  onFilterChange(newFilter: string): void {
    this.selectedBoardFilter.set(newFilter);
  }

  onWidgetDrop(event: CdkDragDrop<OverviewWidget[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    this.widgets.set(widgets);
    this.saveWidgetOrder();
  }

  toggleCollapse(widget: OverviewWidget): void {
    this.widgets.update((widgets) =>
      widgets.map((w) => (w === widget ? { ...w, collapsed: !w.collapsed } : w)),
    );
    this.saveWidgetOrder();
  }

  resetLayout(): void {
    this.widgets.set(DEFAULT_WIDGETS.map((w) => ({ ...w, collapsed: false })));
    this.saveWidgetOrder();
  }

  exportToCsv(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const selectedBoardFilter = this.selectedBoardFilter();
    const filteredTasksWithBoard = this.filteredTasksWithBoard();
    const csv = buildProjectOverviewCsv({
      scopeLabel: selectedBoardFilter === 'all' ? 'All Boards Combined' : selectedBoardFilter,
      burndownBurnup: calculateBurndownBurnup(filteredTasksWithBoard),
      velocity: calculateVelocityTracking(filteredTasksWithBoard),
      utilization: calculateUtilizationHeatmap(filteredTasksWithBoard),
      criticalPath: calculateCriticalPath(filteredTasksWithBoard),
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `project-overview-${selectedBoardFilter}-${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
            this.widgets.set(reordered);
          }
        }
      } catch {
        this.widgets.set([...DEFAULT_WIDGETS]);
      }
    }
  }

  private saveWidgetOrder(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const toStore = this.widgets().map((w) => ({ id: w.id, collapsed: w.collapsed }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {
        // ignore local storage errors
      }
    }
  }
}

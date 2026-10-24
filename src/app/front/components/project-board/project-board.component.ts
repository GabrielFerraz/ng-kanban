import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { TaskCardComponent } from './task-card/task-card.component';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Board } from '../../models/board.model';
import { Task } from '../../models/task.model';
import { MatDialog } from '@angular/material/dialog';
import { ViewTaskModalComponent } from '../modals/view-task-modal/view-task-modal.component';
import { TaskOption } from '../../models/modal.model';
import { buildTaskMap, getUnmetDependencies } from '../../utils/dependency.util';

export type BoardTab = 'board' | 'gantt';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    NgStyle,
    NgClass,
    TaskCardComponent,
    DragDropModule,
    ViewTaskModalComponent,
    GanttChartComponent,
  ],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBoardComponent {
  private dialog = inject(MatDialog);

  colors = ['#49C4E5', '#8471F2', '#67E2AE'];
  activeTab = signal<BoardTab>('board');

  activeBoard = input.required<Board | null>();
  darkMode = input(false);
  columnAdd = output<void>();
  boardEdit = output<Board>();
  taskUpdate = output<{ task: Task; columnName: string }>();
  taskUpdateModal = output<Task>();
  taskDeleteModal = output<Task>();

  boardTasks = computed<Task[]>(() =>
    (this.activeBoard()?.columns ?? []).flatMap((column) => column.tasks ?? []),
  );

  blockedTaskIds = computed(() => {
    const boardTasks = this.boardTasks();
    const tasksById = buildTaskMap(boardTasks);
    const columns = this.activeBoard()?.columns ?? [];
    return new Set(
      boardTasks
        .filter((task) => getUnmetDependencies(task, tasksById, columns).length > 0)
        .map((task) => task.id),
    );
  });

  selectTab(tab: BoardTab): void {
    this.activeTab.set(tab);
  }

  drop(event: CdkDragDrop<Task[]>) {
    const activeBoard = this.activeBoard();
    if (activeBoard) {
      if (event.previousContainer === event.container) {
        moveItemInArray(
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );

        this.boardEdit.emit(activeBoard);
      } else {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );

        this.boardEdit.emit(activeBoard);
      }
    }
  }

  addColumn(): void {
    this.columnAdd.emit();
  }

  viewTask(readTask: Task): void {
    const dialogRef = this.dialog.open(ViewTaskModalComponent, {
      data: {
        task: readTask,
        columns: this.activeBoard()?.columns,
        darkMode: this.darkMode(),
      },
    });

    dialogRef.afterClosed().subscribe((result: TaskOption) => {
      if (result === TaskOption.Edit) {
        this.taskUpdateModal.emit(readTask);
      } else if (result === TaskOption.Delete) {
        this.taskDeleteModal.emit(readTask);
      } else {
        const updateTask = {
          task: dialogRef.componentInstance.data.task,
          columnName: dialogRef.componentInstance.activeStatus().name,
        };

        this.taskUpdate.emit(updateTask);
      }
    });
  }
}

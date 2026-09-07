import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Board } from '../../models/board.model';
import { Task, TaskType } from '../../models/task.model';
import { addDays, toIsoDate } from '../../utils/date.util';
import { BoardHttpService } from '../board-http/board-http.service';

const TASK_ID_PREFIX = 'TASK-';

@Injectable({
  providedIn: 'root',
})
export class BoardDataService {
  private boardHttp = inject(BoardHttpService);
  private platformId = inject(PLATFORM_ID);

  boards = signal<Board[]>([]);

  currentIdx = signal(0);

  activeBoard = computed(() =>
    this.boards().length > 0 ? this.boards()[this.currentIdx()] : null,
  );

  private saveBoards = effect(() => {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('boards', JSON.stringify(this.boards()));
    }
  });


  getBoards(): void {
    let userBoards!: Board[] | null;

    if (isPlatformBrowser(this.platformId)) {
      userBoards = JSON.parse(localStorage.getItem('boards') as string) as
        | Board[]
        | null;
    }

    if (userBoards) {
      this.boards.set(this.normalizeBoards(userBoards));
    } else {
      this.boardHttp
        .getBoards()
        .subscribe((res) => this.boards.set(this.normalizeBoards(res.boards)));
    }
  }

  private normalizeBoards(boards: Board[]): Board[] {
    let nextId = this.nextIdNumber(boards);
    return boards.map((board) => ({
      ...board,
      columns: board.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => {
          const startDate = task.startDate || toIsoDate(new Date());
          return {
            ...task,
            id: task.id || `${TASK_ID_PREFIX}${nextId++}`,
            type: task.type || TaskType.Feature,
            startDate,
            endDate: task.endDate || toIsoDate(addDays(new Date(), 2)),
          };
        }),
      })),
    }));
  }

  private nextIdNumber(boards: Board[]): number {
    const numbers = boards
      .flatMap((board) => board.columns)
      .flatMap((column) => column.tasks)
      .map((task) => Number(`${task.id ?? ''}`.replace(TASK_ID_PREFIX, '')))
      .filter((id) => !isNaN(id));
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  }

  private createTaskId(): string {
    return `${TASK_ID_PREFIX}${this.nextIdNumber(this.boards())}`;
  }

  selectBoard(boardIdx: number) {
    this.currentIdx.set(boardIdx);
  }

  addBoard(board: Board): void {
    this.boards.update((boards) => [...boards, board]);

    this.selectBoard(this.boards().length - 1);
  }

  editBoard(updatedBoard: Board) {
    this.boards.update((boards) =>
      boards.map((board) =>
        board === this.activeBoard() ? { ...updatedBoard } : board,
      ),
    );
  }

  deleteBoard() {
    this.boards.update((boards) =>
      boards.filter((board) => board !== this.activeBoard()),
    );

    if (this.boards().length >= 1) {
      this.selectBoard(0);
    }
  }

  addTask(task: Task) {
    const newTask: Task = { ...task, id: task.id || this.createTaskId() };
    this.boards.update((boards) =>
      boards.map((board) =>
        board === this.activeBoard()
          ? {
              ...board,
              columns: board.columns.map((column) => ({
                ...column,
                tasks:
                  column.name === newTask.status
                    ? [...column.tasks, newTask]
                    : column.tasks,
              })),
            }
          : board,
      ),
    );
  }

  updateTask(updateTask: { task: Task; columnName: string }) {
    const currentColumnName = this.activeBoard()
      ?.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter(
          (task) => task.id === updateTask.task.id,
        ),
      }))
      .filter((column) => column.tasks.length > 0)
      .map((column) => column.name)[0];

    this.boards.update((boards) =>
      boards.map((board) => {
        if (board === this.activeBoard()) {
          if (currentColumnName === updateTask.columnName) {
            // Update same column with updated task
            return {
              ...board,
              columns: board.columns.map((column) => ({
                ...column,
                tasks: column.tasks.map((task) =>
                  task.id === updateTask.task.id
                    ? { ...updateTask.task }
                    : task,
                ),
              })),
            };
          } else {
            // remove task from current column
            return {
              ...board,
              columns: board.columns.map((column) => {
                if (column.name === updateTask.columnName) {
                  return {
                    ...column,
                    tasks: [...column.tasks, updateTask.task],
                  };
                } else if (column.name === currentColumnName) {
                  return {
                    ...column,
                    tasks: column.tasks.filter(
                      (task) => task.id !== updateTask.task.id,
                    ),
                  };
                } else {
                  return column;
                }
              }),
            };
          }
        } else {
          return board;
        }
      }),
    );
  }

  deleteTask(deleteTask: Task) {
    this.boards.update((boards) =>
      boards.map((board) =>
        board === this.activeBoard()
          ? {
              ...board,
              columns: board.columns.map((column) => ({
                ...column,
                tasks: column.tasks.filter((task) => task.id !== deleteTask.id),
              })),
            }
          : board,
      ),
    );
  }
}

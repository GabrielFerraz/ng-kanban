import { PLATFORM_ID, ɵEffectScheduler as EffectScheduler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BoardDataService } from './board-data.service';
import { BoardHttpService } from '../board-http/board-http.service';
import { Board } from '../../models/board.model';
import { Task, TaskType } from '../../models/task.model';

function makeBoard(name: string): Board {
  return {
    name,
    columns: [
      { name: 'Todo', tasks: [] },
      { name: 'Doing', tasks: [] },
    ],
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '',
    type: TaskType.Feature,
    title: 'Task',
    description: '',
    status: 'Todo',
    startDate: '',
    endDate: '',
    subtasks: [],
    dependencies: [],
    ...overrides,
  };
}

describe('BoardDataService', () => {
  let service: BoardDataService;
  let boardHttpSpy: jasmine.SpyObj<BoardHttpService>;

  function configure(platformId: 'browser' | 'server' = 'browser') {
    boardHttpSpy = jasmine.createSpyObj<BoardHttpService>('BoardHttpService', ['getBoards']);
    boardHttpSpy.getBoards.and.returnValue(of({ boards: [] }));

    TestBed.configureTestingModule({
      providers: [
        { provide: BoardHttpService, useValue: boardHttpSpy },
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });
    service = TestBed.inject(BoardDataService);
  }

  afterEach(() => {
    localStorage.removeItem('boards');
  });

  it('should be created', () => {
    configure();
    expect(service).toBeTruthy();
  });

  describe('getBoards', () => {
    it('loads boards from the http service when localStorage is empty', () => {
      localStorage.removeItem('boards');
      configure();
      boardHttpSpy.getBoards.and.returnValue(of({ boards: [makeBoard('From API')] }));

      service.getBoards();

      expect(service.boards().length).toBe(1);
      expect(service.boards()[0].name).toBe('From API');
    });

    it('loads boards from localStorage when present', () => {
      localStorage.setItem('boards', JSON.stringify([makeBoard('From Storage')]));
      configure();

      service.getBoards();

      expect(boardHttpSpy.getBoards).not.toHaveBeenCalled();
      expect(service.boards()[0].name).toBe('From Storage');
    });

    it('normalizes tasks by assigning ids and defaults', () => {
      const board = makeBoard('Board');
      board.columns[0].tasks.push(makeTask({ id: '', type: undefined as unknown as TaskType, startDate: '', endDate: '' }));
      localStorage.setItem('boards', JSON.stringify([board]));
      configure();

      service.getBoards();

      const task = service.boards()[0].columns[0].tasks[0];
      expect(task.id).toBe('TASK-1');
      expect(task.type).toBe(TaskType.Feature);
      expect(task.startDate).toBeTruthy();
      expect(task.endDate).toBeTruthy();
    });

    it('does not read localStorage on the server platform', () => {
      configure('server');
      boardHttpSpy.getBoards.and.returnValue(of({ boards: [makeBoard('SSR Board')] }));

      service.getBoards();

      expect(service.boards()[0].name).toBe('SSR Board');
    });
  });

  describe('selectBoard / activeBoard', () => {
    it('returns null when there are no boards', () => {
      configure();
      expect(service.activeBoard()).toBeNull();
    });

    it('selects a board by index', () => {
      configure();
      service.boards.set([makeBoard('A'), makeBoard('B')]);

      service.selectBoard(1);

      expect(service.activeBoard()?.name).toBe('B');
    });
  });

  describe('addBoard', () => {
    it('appends the board and selects it', () => {
      configure();
      service.boards.set([makeBoard('A')]);

      service.addBoard(makeBoard('B'));

      expect(service.boards().length).toBe(2);
      expect(service.activeBoard()?.name).toBe('B');
    });
  });

  describe('editBoard', () => {
    it('replaces the active board', () => {
      configure();
      service.boards.set([makeBoard('A'), makeBoard('B')]);
      service.selectBoard(0);

      service.editBoard({ name: 'A Renamed', columns: [] });

      expect(service.boards()[0].name).toBe('A Renamed');
      expect(service.boards()[1].name).toBe('B');
    });
  });

  describe('deleteBoard', () => {
    it('removes the active board and selects the first remaining board', () => {
      configure();
      service.boards.set([makeBoard('A'), makeBoard('B')]);
      service.selectBoard(1);

      service.deleteBoard();

      expect(service.boards().length).toBe(1);
      expect(service.boards()[0].name).toBe('A');
      expect(service.currentIdx()).toBe(0);
    });

    it('leaves an empty board list when the last board is removed', () => {
      configure();
      service.boards.set([makeBoard('A')]);
      service.selectBoard(0);

      service.deleteBoard();

      expect(service.boards().length).toBe(0);
    });
  });

  describe('addTask', () => {
    it('adds the task to the matching column and assigns an id when missing', () => {
      configure();
      service.boards.set([makeBoard('A')]);
      service.selectBoard(0);

      service.addTask(makeTask({ id: '', status: 'Todo', title: 'New task' }));

      const todoColumn = service.activeBoard()?.columns.find((c) => c.name === 'Todo');
      expect(todoColumn?.tasks.length).toBe(1);
      expect(todoColumn?.tasks[0].id).toBe('TASK-1');
    });

    it('keeps an existing task id', () => {
      configure();
      service.boards.set([makeBoard('A')]);
      service.selectBoard(0);

      service.addTask(makeTask({ id: 'TASK-9', status: 'Todo' }));

      const todoColumn = service.activeBoard()?.columns.find((c) => c.name === 'Todo');
      expect(todoColumn?.tasks[0].id).toBe('TASK-9');
    });
  });

  describe('updateTask', () => {
    it('updates a task in place when the column stays the same', () => {
      configure();
      const board = makeBoard('A');
      board.columns[0].tasks.push(makeTask({ id: 'TASK-1', status: 'Todo', title: 'Original' }));
      service.boards.set([board]);
      service.selectBoard(0);

      service.updateTask({
        task: makeTask({ id: 'TASK-1', status: 'Todo', title: 'Updated' }),
        columnName: 'Todo',
      });

      const todoColumn = service.activeBoard()?.columns.find((c) => c.name === 'Todo');
      expect(todoColumn?.tasks[0].title).toBe('Updated');
    });

    it('moves a task between columns', () => {
      configure();
      const board = makeBoard('A');
      board.columns[0].tasks.push(makeTask({ id: 'TASK-1', status: 'Todo' }));
      service.boards.set([board]);
      service.selectBoard(0);

      service.updateTask({
        task: makeTask({ id: 'TASK-1', status: 'Doing' }),
        columnName: 'Doing',
      });

      const todoColumn = service.activeBoard()?.columns.find((c) => c.name === 'Todo');
      const doingColumn = service.activeBoard()?.columns.find((c) => c.name === 'Doing');
      expect(todoColumn?.tasks.length).toBe(0);
      expect(doingColumn?.tasks.length).toBe(1);
    });
  });

  describe('deleteTask', () => {
    it('removes the task from its column', () => {
      configure();
      const board = makeBoard('A');
      board.columns[0].tasks.push(makeTask({ id: 'TASK-1', status: 'Todo' }));
      service.boards.set([board]);
      service.selectBoard(0);

      service.deleteTask(makeTask({ id: 'TASK-1', status: 'Todo' }));

      const todoColumn = service.activeBoard()?.columns.find((c) => c.name === 'Todo');
      expect(todoColumn?.tasks.length).toBe(0);
    });
  });

  describe('persistence effect', () => {
    it('saves boards to localStorage in the browser', () => {
      configure('browser');

      service.boards.set([makeBoard('Persisted')]);
      // TestBed swaps in a queueing EffectScheduler that only flushes explicitly
      (TestBed.inject(EffectScheduler) as unknown as { flush: () => void }).flush();

      const stored = JSON.parse(localStorage.getItem('boards') as string);
      expect(stored[0].name).toBe('Persisted');
    });
  });
});

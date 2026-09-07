import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ProjectBoardComponent } from './project-board.component';
import { Board } from '../../models/board.model';
import { TaskType } from '../../models/task.model';
import { TaskOption } from '../../models/modal.model';

describe('ProjectBoardComponent', () => {
  let component: ProjectBoardComponent;
  let fixture: ComponentFixture<ProjectBoardComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const board: Board = {
    name: 'Roadmap',
    columns: [
      {
        name: 'Todo',
        tasks: [
          {
            id: 'TASK-1',
            type: TaskType.Feature,
            title: 'Build UI',
            description: '',
            status: 'Todo',
            startDate: '',
            endDate: '',
            subtasks: [],
            dependencies: [],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProjectBoardComponent],
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectBoardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activeBoard', board);
    fixture.componentRef.setInput('darkMode', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('flattens board tasks on input change', () => {
    expect(component.boardTasks.length).toBe(1);
    expect(component.boardTasks[0].id).toBe('TASK-1');
  });

  it('switches between board and gantt tabs', () => {
    expect(component.activeTab).toBe('board');
    component.selectTab('gantt');
    expect(component.activeTab).toBe('gantt');
  });

  it('emits columnAdd when addColumn is called', () => {
    const spy = jasmine.createSpy('columnAdd');
    component.columnAdd.subscribe(spy);

    component.addColumn();

    expect(spy).toHaveBeenCalled();
  });

  it('opens the view task dialog and emits taskUpdate on close', () => {
    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed'], {
      componentInstance: {
        data: { task: board.columns[0].tasks[0] },
        activeStatus: { name: 'Todo' },
      },
    });
    dialogRefSpy.afterClosed.and.returnValue(of(undefined));
    dialogSpy.open.and.returnValue(dialogRefSpy);

    const updateSpy = jasmine.createSpy('taskUpdate');
    component.taskUpdate.subscribe(updateSpy);

    component.viewTask(board.columns[0].tasks[0]);

    expect(updateSpy).toHaveBeenCalledWith({ task: board.columns[0].tasks[0], columnName: 'Todo' });
  });

  it('emits taskUpdateModal when dialog closes with Edit option', () => {
    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed'], {
      componentInstance: { data: {}, activeStatus: {} },
    });
    dialogRefSpy.afterClosed.and.returnValue(of(TaskOption.Edit));
    dialogSpy.open.and.returnValue(dialogRefSpy);

    const editSpy = jasmine.createSpy('taskUpdateModal');
    component.taskUpdateModal.subscribe(editSpy);

    component.viewTask(board.columns[0].tasks[0]);

    expect(editSpy).toHaveBeenCalledWith(board.columns[0].tasks[0]);
  });

  it('emits taskDeleteModal when dialog closes with Delete option', () => {
    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<unknown>>('MatDialogRef', ['afterClosed'], {
      componentInstance: { data: {}, activeStatus: {} },
    });
    dialogRefSpy.afterClosed.and.returnValue(of(TaskOption.Delete));
    dialogSpy.open.and.returnValue(dialogRefSpy);

    const deleteSpy = jasmine.createSpy('taskDeleteModal');
    component.taskDeleteModal.subscribe(deleteSpy);

    component.viewTask(board.columns[0].tasks[0]);

    expect(deleteSpy).toHaveBeenCalledWith(board.columns[0].tasks[0]);
  });
});


import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { BoardModalComponent } from './board-modal.component';
import { Board } from '../../../models/board.model';

describe('BoardModalComponent', () => {
  let component: BoardModalComponent;
  let fixture: ComponentFixture<BoardModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoardModalComponent>>;

  function configure(board: Board = { name: '', columns: [] }) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<BoardModalComponent>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [BoardModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { board, darkMode: false } },
      ],
    });

    fixture = TestBed.createComponent(BoardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    configure();
    expect(component).toBeTruthy();
  });

  it('builds default Todo/Doing columns for a new board', () => {
    configure();
    expect(component.columnArray.length).toBe(2);
    expect(component.columnArray.at(0).get('name')?.value).toBe('Todo');
    expect(component.columnArray.at(1).get('name')?.value).toBe('Doing');
  });

  it('populates columns from an existing board', () => {
    configure({ name: 'Roadmap', columns: [{ name: 'Backlog', tasks: [] }, { name: 'Done', tasks: [] }] });
    expect(component.columnArray.length).toBe(2);
    expect(component.columnArray.at(0).get('name')?.value).toBe('Backlog');
    expect(component.form.get('name')?.value).toBe('Roadmap');
  });

  it('addColumn appends a new empty column', () => {
    configure();
    component.addColumn();
    expect(component.columnArray.length).toBe(3);
  });

  it('removeColumn removes a column at index', () => {
    configure();
    component.removeColumn(1);
    expect(component.columnArray.length).toBe(1);
  });

  it('submit closes the dialog with form value for a new board', () => {
    configure();
    component.form.patchValue({ name: 'New Board' });

    component.submit();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'New Board' }));
  });

  it('submit preserves existing task lists when editing a board', () => {
    const existingTask = { id: 'TASK-1', type: 'Feature', title: 'X', description: '', status: 'Todo', startDate: '', endDate: '', subtasks: [] } as any;
    configure({ name: 'Roadmap', columns: [{ name: 'Backlog', tasks: [existingTask] }] });

    component.submit();

    const closedWith = dialogRefSpy.close.calls.mostRecent().args[0] as Board;
    expect(closedWith.columns[0].tasks).toEqual([existingTask]);
  });
});


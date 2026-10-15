import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TaskModalComponent } from './task-modal.component';
import { Task, TaskType } from '../../../models/task.model';
import { Column } from '../../../models/column.model';

describe('TaskModalComponent', () => {
  let component: TaskModalComponent;
  let fixture: ComponentFixture<TaskModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TaskModalComponent>>;

  const columns: Column[] = [
    { name: 'Todo', tasks: [] },
    { name: 'Doing', tasks: [] },
  ];

  function configure(task: Task | undefined, editMode: boolean) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<TaskModalComponent>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [TaskModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { task, darkMode: false, columns, editMode } },
      ],
    });

    fixture = TestBed.createComponent(TaskModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create for a new task', () => {
    configure(undefined as unknown as Task, false);
    expect(component).toBeTruthy();
  });

  it('defaults status to the first column when adding a task', () => {
    configure(undefined as unknown as Task, false);
    expect(component.form.get('status')?.value).toBe('Todo');
  });

  it('prefills the form when editing an existing task', () => {
    const task: Task = {
      id: 'TASK-1',
      type: TaskType.Bug,
      title: 'Fix bug',
      description: 'desc',
      status: 'Doing',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      subtasks: [{ title: 'Sub 1', isCompleted: false }],
      dependencies: [],
    };
    configure(task, true);

    expect(component.form.get('title')?.value).toBe('Fix bug');
    expect(component.subTaskArray.length).toBe(1);
  });

  it('marks the form invalid with mismatched date range', () => {
    configure(undefined as unknown as Task, false);
    component.form.patchValue({ startDate: '2024-01-10', endDate: '2024-01-01' });
    expect(component.form.errors?.['dateRange']).toBeTrue();
  });

  it('addSubtask appends a new subtask group', () => {
    configure(undefined as unknown as Task, false);
    const before = component.subTaskArray.length;
    component.addSubtask();
    expect(component.subTaskArray.length).toBe(before + 1);
  });

  it('removeSubtask removes a subtask at index', () => {
    configure(undefined as unknown as Task, false);
    component.removeSubtask(0);
    expect(component.subTaskArray.length).toBe(1);
  });

  it('submit closes with id "" for a new task', () => {
    configure(undefined as unknown as Task, false);
    component.form.patchValue({ title: 'New task' });

    component.submit();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ id: '', title: 'New task' }));
  });
});


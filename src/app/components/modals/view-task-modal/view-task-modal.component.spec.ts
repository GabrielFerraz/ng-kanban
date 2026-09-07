import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ViewTaskModalComponent } from './view-task-modal.component';
import { Task, TaskType } from '../../../models/task.model';
import { Column } from '../../../models/column.model';
import { TaskOption } from '../../../models/modal.model';

describe('ViewTaskModalComponent', () => {
  let component: ViewTaskModalComponent;
  let fixture: ComponentFixture<ViewTaskModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewTaskModalComponent>>;

  const task: Task = {
    id: 'TASK-1',
    type: TaskType.Feature,
    title: 'Build UI',
    description: 'desc',
    status: 'Todo',
    startDate: '2024-01-01',
    endDate: '2024-01-05',
    subtasks: [
      { title: 'Sub 1', isCompleted: true },
      { title: 'Sub 2', isCompleted: false },
    ],
  };

  const columns: Column[] = [
    { name: 'Todo', tasks: [task] },
    { name: 'Doing', tasks: [] },
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ViewTaskModalComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewTaskModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { task: { ...task }, darkMode: false, columns } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewTaskModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('finds the active status column containing the task', () => {
    expect(component.activeStatus.name).toBe('Todo');
  });

  it('computes the type color for the task type', () => {
    expect(component.typeColor).toBe('#635fc7');
  });

  it('calculateCompleted counts completed subtasks', () => {
    expect(component.calculateCompleted(component.data.task.subtasks)).toBe(1);
  });

  it('updateSubtask toggles isCompleted', () => {
    const subtask = component.data.task.subtasks[1];
    component.updateSubtask(subtask);
    expect(component.data.task.subtasks[1].isCompleted).toBeTrue();
  });

  it('editTask closes the dialog with Edit option', () => {
    component.editTask();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(TaskOption.Edit);
  });

  it('deleteTask closes the dialog with Delete option', () => {
    component.deleteTask();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(TaskOption.Delete);
  });

  it('updateStatus changes the task status and active column', () => {
    component.updateStatus({ target: { value: 'Doing' } } as unknown as Event);
    expect(component.data.task.status).toBe('Doing');
    expect(component.activeStatus.name).toBe('Doing');
  });
});


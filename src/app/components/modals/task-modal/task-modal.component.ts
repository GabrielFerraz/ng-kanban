import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Column } from '../../../models/column.model';
import { TASK_TYPES, Task, TaskType } from '../../../models/task.model';
import { SubTask } from '../../../models/subTask.model';
import { addDays, toIsoDate } from '../../../utils/date.util';
import { dateRangeValidator } from './date-range.validator';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, MatMenuModule],
  templateUrl: './task-modal.component.html',
  styleUrl: './task-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<TaskModalComponent>>(MatDialogRef);
  data = inject<{
    task: Task;
    darkMode: boolean;
    columns: Column[];
    editMode: boolean;
  }>(MAT_DIALOG_DATA);

  @ViewChild(MatMenuTrigger) trigger!: MatMenuTrigger;

  form!: FormGroup;
  opened = false;
  taskTypes = TASK_TYPES;

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.nonNullable.group({
      title: this.fb.control(this.data.task?.title || '', {
        validators: [Validators.required],
      }),
      description: this.fb.control(this.data.task?.description || ''),
      type: this.fb.control(this.data.task?.type || TaskType.Feature, {
        validators: [Validators.required],
      }),
      startDate: this.fb.control(
        this.data.task?.startDate || toIsoDate(new Date()),
        { validators: [Validators.required] },
      ),
      endDate: this.fb.control(
        this.data.task?.endDate || toIsoDate(addDays(new Date(), 2)),
        { validators: [Validators.required] },
      ),
      status: this.fb.control(
        this.data.task?.status || this.data.columns[0].name,
        {
          validators: [Validators.required],
        },
      ),
      subtasks: this.fb.array([
        this.fb.nonNullable.group({
          isCompleted: false,
          title: ['', Validators.required],
        }),
        this.fb.nonNullable.group({
          isCompleted: false,
          title: ['', Validators.required],
        }),
      ]),
    });

    this.form.addValidators(dateRangeValidator('startDate', 'endDate'));
    this.form.updateValueAndValidity();

    if (this.data.task?.subtasks.length > 0) {
      this.subTaskArray.clear();
      this.data.task.subtasks.forEach((subtask) => this.addSubtask(subtask));
    }
  }

  get subTaskArray() {
    return this.form.get('subtasks') as FormArray;
  }

  addSubtask(subtask: SubTask = { title: '', isCompleted: false }) {
    const group = this.fb.nonNullable.group({
      isCompleted: subtask.isCompleted,
      title: [subtask.title, Validators.required],
    });
    this.subTaskArray.push(group);
  }

  removeSubtask(index: number): void {
    this.subTaskArray.removeAt(index);
  }

  openDropdown(): void {
    this.trigger.openMenu();
  }

  open(): void {
    this.opened = true;
  }

  close(): void {
    this.opened = false;
  }

  submit() {
    const editMode = this.data.editMode;

    if (editMode) {
      const updatedTask: Task = {
        ...this.data.task,
        ...this.form.value,
      };

      this.dialogRef.close({ ...updatedTask });
    }

    if (!editMode) {
      this.dialogRef.close({ id: '', ...this.form.value });
    }
  }
}

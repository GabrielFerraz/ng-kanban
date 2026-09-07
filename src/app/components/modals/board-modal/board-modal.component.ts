import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Board } from '../../../models/board.model';

@Component({
  selector: 'app-board-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './board-modal.component.html',
  styleUrl: './board-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<BoardModalComponent>>(MatDialogRef);
  data = inject<{ board: Board; darkMode: boolean }>(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.nonNullable.group({
      name: this.fb.control(this.data.board?.name || '', {
        validators: [Validators.required],
      }),
      columns: this.fb.array([
        this.fb.nonNullable.group({
          name: ['Todo', Validators.required],
          tasks: [[]],
        }),
        this.fb.nonNullable.group({
          name: ['Doing', Validators.required],
          tasks: [[]],
        }),
      ]),
    });

    if (this.data.board?.columns?.length > 0) {
      this.columnArray.clear();
      this.data.board.columns.forEach((column) => this.addColumn(column.name));
    }
  }

  get columnArray() {
    return this.form.get('columns') as FormArray;
  }

  addColumn(name: string = ''): void {
    const group = this.fb.nonNullable.group({
      name: [name, Validators.required],
      tasks: [[]],
    });
    this.columnArray.push(group);
  }

  removeColumn(index: number): void {
    this.columnArray.removeAt(index);
  }

  submit() {
    const editMode = !!this.data.board.name;

    if (editMode) {
      const updatedBoard: Board = {
        ...this.data.board,
        name: this.form.value.name,
        columns: this.form.value.columns.map(
          (column: { name: string }, index: number) => ({
            name: column.name,
            tasks: this.data.board.columns[index]?.tasks || [],
          }),
        ),
      };

      this.dialogRef.close({ ...updatedBoard });
    }

    if (!editMode) {
      this.dialogRef.close({ ...this.form.value });
    }
  }
}

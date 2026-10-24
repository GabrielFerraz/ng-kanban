import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './delete-modal.component.html',
  styleUrl: './delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteModalComponent {
  private dialogRef = inject<MatDialogRef<DeleteModalComponent>>(MatDialogRef);
  data = inject<{ name: string; isBoard: boolean; darkMode: boolean }>(MAT_DIALOG_DATA);

  remove(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

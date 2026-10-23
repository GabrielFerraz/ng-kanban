import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgClass, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  opened = input.required<boolean>();
  activeBoard = input.required<Board | null>();
  boards = input.required<Board[]>();
  darkMode = input.required<boolean>();
  isOverview = input(false);

  boardSelect = output<number>();
  boardAdd = output<void>();
  boardEdit = output<void>();
  boardDelete = output<void>();
  boardExport = output<void>();
  taskAdd = output<void>();
  overviewSelect = output<void>();

  sidebarShown = signal(false);

  selectBoard(boardIdx: number): void {
    this.sidebarShown.set(false);
    this.boardSelect.emit(boardIdx);
  }

  selectOverview(): void {
    this.sidebarShown.set(false);
    this.overviewSelect.emit();
  }

  addBoard(): void {
    this.boardAdd.emit();
  }

  editBoard(): void {
    this.boardEdit.emit();
  }

  deleteBoard(): void {
    this.boardDelete.emit();
  }

  exportBoard(): void {
    this.boardExport.emit();
  }

  addTask(): void {
    this.taskAdd.emit();
  }

  open(): void {
    this.sidebarShown.set(true);
  }

  close(): void {
    this.sidebarShown.set(false);
  }

  stopPropagation(e: Event) {
    e.stopPropagation();
  }
}

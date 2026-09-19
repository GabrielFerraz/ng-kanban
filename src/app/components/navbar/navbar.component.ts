import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
  @Input() opened!: boolean;
  @Input() activeBoard!: Board | null;
  @Input() boards!: Board[];
  @Input() darkMode!: boolean;
  @Input() isOverview = false;

  @Output() boardSelect = new EventEmitter<number>();
  @Output() boardAdd = new EventEmitter<void>();
  @Output() boardEdit = new EventEmitter<void>();
  @Output() boardDelete = new EventEmitter<void>();
  @Output() boardExport = new EventEmitter<void>();
  @Output() taskAdd = new EventEmitter<void>();
  @Output() overviewSelect = new EventEmitter<void>();

  sidebarShown = false;

  selectBoard(boardIdx: number): void {
    this.sidebarShown = false;
    this.boardSelect.emit(boardIdx);
  }

  selectOverview(): void {
    this.sidebarShown = false;
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
    this.sidebarShown = true;
  }

  close(): void {
    this.sidebarShown = false;
  }

  stopPropagation(e: Event) {
    e.stopPropagation();
  }
}

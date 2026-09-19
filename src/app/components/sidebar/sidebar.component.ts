import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Board } from '../../models/board.model';
import { ThemeTogglerComponent } from './theme-toggler/theme-toggler.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, ThemeTogglerComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input() boards: Board[] = [];
  @Input() activeBoard!: Board | null;
  @Input() opened!: boolean;
  @Input() isOverview = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() enableDarkMode = new EventEmitter<boolean>();
  @Output() add = new EventEmitter<void>();
  @Output() selected = new EventEmitter<number>();
  @Output() overviewSelected = new EventEmitter<void>();

  collapseSidebar(): void {
    this.closeSidebar.emit();
  }

  addBoard(): void {
    this.add.emit();
  }

  selectBoard(boardIdx: number): void {
    this.selected.emit(boardIdx);
  }

  selectOverview(): void {
    this.overviewSelected.emit();
  }
}

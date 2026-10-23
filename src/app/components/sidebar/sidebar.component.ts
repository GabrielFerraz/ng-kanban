import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
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
  boards = input<Board[]>([]);
  activeBoard = input.required<Board | null>();
  opened = input.required<boolean>();
  isOverview = input(false);
  closeSidebar = output<void>();
  enableDarkMode = output<boolean>();
  add = output<void>();
  selected = output<number>();
  overviewSelected = output<void>();

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

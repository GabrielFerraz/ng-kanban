import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { tap, Observable } from 'rxjs';

@Component({
  selector: 'app-theme-toggler',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  templateUrl: './theme-toggler.component.html',
  styleUrl: './theme-toggler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeTogglerComponent implements OnInit {
  @Output() enableDarkMode = new EventEmitter<boolean>();

  toggleDarkMode = new FormControl<boolean>(false);
  darkModeValueChanges!: Observable<boolean | null>;

  ngOnInit(): void {
    this.darkModeValueChanges = this.toggleDarkMode.valueChanges.pipe(
      tap((value) => this.enableDarkMode.emit(value as boolean)),
    );
  }
}

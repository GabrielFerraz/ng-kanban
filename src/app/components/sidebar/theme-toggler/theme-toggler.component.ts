import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-theme-toggler',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './theme-toggler.component.html',
  styleUrl: './theme-toggler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeTogglerComponent {
  enableDarkMode = output<boolean>();

  toggleDarkMode = new FormControl<boolean>(false);

  constructor() {
    this.toggleDarkMode.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.enableDarkMode.emit(value as boolean));
  }
}

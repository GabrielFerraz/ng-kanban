import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-sidebar-toggle',
  standalone: true,
  imports: [],
  templateUrl: './sidebar-toggle.component.html',
  styleUrl: './sidebar-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarToggleComponent {
  openSidebar = output<void>();

  expandSidebar(): void {
    this.openSidebar.emit();
  }
}

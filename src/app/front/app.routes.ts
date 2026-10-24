import { Routes } from '@angular/router';
import { ProjectOverviewComponent } from './components/project-overview/project-overview.component';

export const routes: Routes = [
  {
    path: 'overview',
    component: ProjectOverviewComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

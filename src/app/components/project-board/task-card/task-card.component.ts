import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Task } from '../../../models/task.model';
import { SubTask } from '../../../models/subTask.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  task = input.required<Task>();
  blocked = input(false);

  calculateCompleted(subtasks: SubTask[]): number {
    return subtasks.filter((s) => s.isCompleted).length;
  }
}

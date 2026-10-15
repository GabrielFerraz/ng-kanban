import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCardComponent } from './task-card.component';
import { TaskType } from '../../../models/task.model';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.task = {
      id: 'TASK-1',
      type: TaskType.Feature,
      title: 'Build UI',
      description: '',
      status: 'Todo',
      startDate: '',
      endDate: '',
      subtasks: [
        { title: 'Sub 1', isCompleted: true },
        { title: 'Sub 2', isCompleted: false },
      ],
      dependencies: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders task title', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Build UI');
  });

  it('shows completed subtask count', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('1 of 2 subtasks');
  });

  describe('calculateCompleted', () => {
    it('counts completed subtasks', () => {
      expect(component.calculateCompleted(component.task.subtasks)).toBe(1);
    });

    it('returns 0 for no subtasks', () => {
      expect(component.calculateCompleted([])).toBe(0);
    });
  });
});


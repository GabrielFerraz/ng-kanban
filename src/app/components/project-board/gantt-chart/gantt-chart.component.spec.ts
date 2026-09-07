import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttChartComponent } from './gantt-chart.component';
import { Task, TaskType } from '../../../models/task.model';

describe('GanttChartComponent', () => {
  let component: GanttChartComponent;
  let fixture: ComponentFixture<GanttChartComponent>;

  function makeTask(overrides: Partial<Task>): Task {
    return {
      id: 'TASK-1',
      type: TaskType.Feature,
      title: 'Task',
      description: '',
      status: 'Todo',
      startDate: '2024-01-01',
      endDate: '2024-01-03',
      subtasks: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GanttChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GanttChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows the empty state when there are no tasks', () => {
    fixture.componentRef.setInput('tasks', []);
    fixture.detectChanges();

    expect(component.rows.length).toBe(0);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('no tasks to display');
  });

  it('builds one row per task with computed duration', () => {
    fixture.componentRef.setInput('tasks', [
      makeTask({ id: 'TASK-1', startDate: '2024-01-01', endDate: '2024-01-03' }),
    ]);
    fixture.detectChanges();

    expect(component.rows.length).toBe(1);
    expect(component.rows[0].duration).toBe(3);
  });

  it('treats an end date before start date as same-day', () => {
    fixture.componentRef.setInput('tasks', [
      makeTask({ id: 'TASK-1', startDate: '2024-01-05', endDate: '2024-01-01' }),
    ]);
    fixture.detectChanges();

    expect(component.rows[0].duration).toBe(1);
  });

  it('sortBy toggles direction when the same key is clicked twice', () => {
    fixture.componentRef.setInput('tasks', [
      makeTask({ id: 'TASK-2', title: 'B', startDate: '2024-01-02', endDate: '2024-01-02' }),
      makeTask({ id: 'TASK-1', title: 'A', startDate: '2024-01-01', endDate: '2024-01-01' }),
    ]);
    fixture.detectChanges();

    component.sortBy('title');
    expect(component.rows[0].task.title).toBe('A');

    component.sortBy('title');
    expect(component.rows[0].task.title).toBe('B');
  });

  it('sortIcon reflects the active sort key and direction', () => {
    fixture.componentRef.setInput('tasks', [makeTask({})]);
    fixture.detectChanges();

    component.sortKey = 'title';
    component.sortDirection = 'asc';
    expect(component.sortIcon('title')).toBe('▲');
    expect(component.sortIcon('status')).toBe('');
  });
});

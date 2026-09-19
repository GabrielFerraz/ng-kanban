import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskType } from '../../../models/task.model';
import { CriticalPathComponent } from './critical-path.component';

describe('CriticalPathComponent', () => {
  let component: CriticalPathComponent;
  let fixture: ComponentFixture<CriticalPathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriticalPathComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CriticalPathComponent);
    component = fixture.componentInstance;
    component.tasksWithBoard = [
      {
        task: {
          id: 'T-1',
          type: TaskType.Feature,
          title: 'Prerequisite',
          description: '',
          status: 'Done',
          startDate: '2026-09-01',
          endDate: '2026-09-03',
          subtasks: [],
          dependencies: [],
        },
        boardName: 'Launch',
        isDone: true,
      },
      {
        task: {
          id: 'T-2',
          type: TaskType.Feature,
          title: 'Dependent Task',
          description: '',
          status: 'Doing',
          startDate: '2026-09-04',
          endDate: '2026-09-06',
          subtasks: [],
          dependencies: ['T-1'],
        },
        boardName: 'Launch',
        isDone: false,
      },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters tasks by mode', () => {
    component.ngOnChanges({
      tasksWithBoard: {
        previousValue: [],
        currentValue: component.tasksWithBoard,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    component.setFilter('critical');
    expect(component.filterMode).toBe('critical');
    expect(component.getFilteredTasks().length).toBeGreaterThan(0);
  });
});

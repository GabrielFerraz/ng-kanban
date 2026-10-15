import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskType } from '../../../models/task.model';
import { UtilizationHeatmapComponent } from './utilization-heatmap.component';

describe('UtilizationHeatmapComponent', () => {
  let component: UtilizationHeatmapComponent;
  let fixture: ComponentFixture<UtilizationHeatmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilizationHeatmapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilizationHeatmapComponent);
    component = fixture.componentInstance;
    component.tasksWithBoard = [
      {
        task: {
          id: 'T-1',
          type: TaskType.Feature,
          title: 'Task 1',
          description: '',
          status: 'Doing',
          startDate: '2026-09-01',
          endDate: '2026-09-08',
          subtasks: [],
          dependencies: [],
          assignee: 'Alex Morgan',
          timeToComplete: 16,
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

  it('toggles person tasks accordion', () => {
    expect(component.expandedPersonName).toBeNull();
    component.togglePersonExpand('Alex Morgan');
    expect(component.expandedPersonName).toBe('Alex Morgan');
    component.togglePersonExpand('Alex Morgan');
    expect(component.expandedPersonName).toBeNull();
  });
});

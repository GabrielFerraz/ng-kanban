import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskType } from '../../../models/task.model';
import { VelocityTrackingComponent } from './velocity-tracking.component';

describe('VelocityTrackingComponent', () => {
  let component: VelocityTrackingComponent;
  let fixture: ComponentFixture<VelocityTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VelocityTrackingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VelocityTrackingComponent);
    component = fixture.componentInstance;
    component.tasksWithBoard = [
      {
        task: {
          id: 'T-1',
          type: TaskType.Feature,
          title: 'Task 1',
          description: '',
          status: 'Done',
          startDate: '2026-08-10',
          endDate: '2026-08-20',
          subtasks: [],
          dependencies: [],
        },
        boardName: 'Launch',
        isDone: true,
      },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calculates velocity and displays consistency', () => {
    component.ngOnChanges({
      tasksWithBoard: {
        previousValue: [],
        currentValue: component.tasksWithBoard,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(component.velocity).toBeTruthy();
    expect(component.velocity?.weeks.length).toBe(6);
  });
});

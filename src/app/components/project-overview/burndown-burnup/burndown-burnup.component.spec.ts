import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskType } from '../../../models/task.model';
import { BurndownBurnupComponent } from './burndown-burnup.component';

describe('BurndownBurnupComponent', () => {
  let component: BurndownBurnupComponent;
  let fixture: ComponentFixture<BurndownBurnupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurndownBurnupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BurndownBurnupComponent);
    component = fixture.componentInstance;
    component.tasksWithBoard = [
      {
        task: {
          id: 'T-1',
          type: TaskType.Feature,
          title: 'UI Task',
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

  it('switches chart view modes', () => {
    component.setViewMode('burndown');
    expect(component.viewMode).toBe('burndown');

    component.setViewMode('burnup');
    expect(component.viewMode).toBe('burnup');

    component.setViewMode('both');
    expect(component.viewMode).toBe('both');
  });
});

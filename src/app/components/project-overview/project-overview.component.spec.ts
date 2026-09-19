import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Board } from '../../models/board.model';
import { ProjectOverviewComponent } from './project-overview.component';

describe('ProjectOverviewComponent', () => {
  let component: ProjectOverviewComponent;
  let fixture: ComponentFixture<ProjectOverviewComponent>;

  const mockBoards: Board[] = [
    {
      name: 'Launch Board',
      columns: [
        {
          name: 'Todo',
          tasks: [],
        },
        {
          name: 'Done',
          tasks: [],
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectOverviewComponent);
    component = fixture.componentInstance;
    component.boards = mockBoards;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with 4 draggable widgets', () => {
    expect(component.widgets.length).toBe(4);
    const ids = component.widgets.map((w) => w.id);
    expect(ids).toContain('burndown-burnup');
    expect(ids).toContain('velocity-tracking');
    expect(ids).toContain('utilization-heatmap');
    expect(ids).toContain('critical-path');
  });

  it('allows collapsing and expanding widgets', () => {
    const widget = component.widgets[0];
    expect(widget.collapsed).toBeFalse();
    component.toggleCollapse(widget);
    expect(widget.collapsed).toBeTrue();
  });

  it('resets layout to default', () => {
    component.widgets[0].collapsed = true;
    component.resetLayout();
    expect(component.widgets[0].collapsed).toBeFalse();
  });
});

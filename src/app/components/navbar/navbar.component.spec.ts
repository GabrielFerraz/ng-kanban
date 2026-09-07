import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';
import { Board } from '../../models/board.model';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  const board: Board = { name: 'Platform Launch', columns: [{ name: 'Todo', tasks: [] }] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    component.opened = true;
    component.activeBoard = board;
    component.boards = [board];
    component.darkMode = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders active board name', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Platform Launch');
  });

  it('emits taskAdd when addTask is called', () => {
    const spy = jasmine.createSpy('taskAdd');
    component.taskAdd.subscribe(spy);

    component.addTask();

    expect(spy).toHaveBeenCalled();
  });

  it('emits boardSelect with index', () => {
    const spy = jasmine.createSpy('boardSelect');
    component.boardSelect.subscribe(spy);

    component.selectBoard(2);

    expect(spy).toHaveBeenCalledWith(2);
  });

  it('toggles mobile sidebar state', () => {
    expect(component.sidebarShown).toBeFalse();

    component.open();
    expect(component.sidebarShown).toBeTrue();

    component.close();
    expect(component.sidebarShown).toBeFalse();
  });

  it('stopPropagation stops the event', () => {
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.stopPropagation(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });
});

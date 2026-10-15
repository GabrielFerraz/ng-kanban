import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { Board } from '../../models/board.model';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  const boards: Board[] = [
    { name: 'Board A', columns: [] },
    { name: 'Board B', columns: [] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    component.boards = boards;
    component.activeBoard = boards[0];
    component.opened = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists all board names', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Board A');
    expect(text).toContain('Board B');
  });

  it('emits selected when a non-active board is clicked', () => {
    const spy = jasmine.createSpy('selected');
    component.selected.subscribe(spy);

    component.selectBoard(1);

    expect(spy).toHaveBeenCalledWith(1);
  });

  it('emits add when addBoard is called', () => {
    const spy = jasmine.createSpy('add');
    component.add.subscribe(spy);

    component.addBoard();

    expect(spy).toHaveBeenCalled();
  });

  it('emits closeSidebar when collapseSidebar is called', () => {
    const spy = jasmine.createSpy('closeSidebar');
    component.closeSidebar.subscribe(spy);

    component.collapseSidebar();

    expect(spy).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarToggleComponent } from './sidebar-toggle.component';

describe('SidebarToggleComponent', () => {
  let component: SidebarToggleComponent;
  let fixture: ComponentFixture<SidebarToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits openSidebar when button clicked', () => {
    const spy = jasmine.createSpy('openSidebar');
    component.openSidebar.subscribe(spy);

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(spy).toHaveBeenCalled();
  });

  it('expandSidebar emits directly', () => {
    const spy = jasmine.createSpy('openSidebar');
    component.openSidebar.subscribe(spy);

    component.expandSidebar();

    expect(spy).toHaveBeenCalled();
  });
});

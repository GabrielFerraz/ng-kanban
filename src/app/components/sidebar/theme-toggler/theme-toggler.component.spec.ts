import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeTogglerComponent } from './theme-toggler.component';

describe('ThemeTogglerComponent', () => {
  let component: ThemeTogglerComponent;
  let fixture: ComponentFixture<ThemeTogglerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeTogglerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeTogglerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits enableDarkMode when checkbox toggled', () => {
    const spy = jasmine.createSpy('enableDarkMode');
    component.enableDarkMode.subscribe(spy);

    component.toggleDarkMode.setValue(true);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('defaults to light mode', () => {
    expect(component.toggleDarkMode.value).toBeFalse();
  });
});

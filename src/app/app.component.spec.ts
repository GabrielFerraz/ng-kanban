import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();

    httpMock.expectOne('assets/data.json').flush({ boards: [] });
  });

  it('toggles dark mode', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    httpMock.expectOne('assets/data.json').flush({ boards: [] });

    fixture.componentInstance.toggleDarkMode(true);

    expect(fixture.componentInstance.darkMode).toBeTrue();
  });

  it('opens and closes the sidebar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    httpMock.expectOne('assets/data.json').flush({ boards: [] });

    fixture.componentInstance.closeSidebar();
    expect(fixture.componentInstance.isSidebarOpen).toBeFalse();

    fixture.componentInstance.openSideBar();
    expect(fixture.componentInstance.isSidebarOpen).toBeTrue();
  });

  it('selects a board by index', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    httpMock.expectOne('assets/data.json').flush({
      boards: [
        { name: 'A', columns: [] },
        { name: 'B', columns: [] },
      ],
    });

    fixture.componentInstance.selectBoard(1);

    expect(fixture.componentInstance.activeBoard()?.name).toBe('B');
  });
});


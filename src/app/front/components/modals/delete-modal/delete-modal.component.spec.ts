import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DeleteModalComponent } from './delete-modal.component';

describe('DeleteModalComponent', () => {
  let component: DeleteModalComponent;
  let fixture: ComponentFixture<DeleteModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeleteModalComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<DeleteModalComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeleteModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Board 1', isBoard: true, darkMode: false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows board copy when isBoard is true', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('board');
    expect(text).toContain('Board 1');
  });

  it('closes with true on remove', () => {
    component.remove();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('closes with false on cancel', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });
});

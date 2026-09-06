import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(
  startControlName: string,
  endControlName: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startControlName)?.value as string;
    const end = group.get(endControlName)?.value as string;

    if (!start || !end) return null;
    return end < start ? { dateRange: true } : null;
  };
}

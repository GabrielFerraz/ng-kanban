import { FormBuilder } from '@angular/forms';
import { dateRangeValidator } from './date-range.validator';

describe('dateRangeValidator', () => {
  const fb = new FormBuilder();

  function buildGroup(startDate: string, endDate: string) {
    return fb.group({ startDate, endDate });
  }

  it('returns null when end date is after start date', () => {
    const group = buildGroup('2024-01-01', '2024-01-05');
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toBeNull();
  });

  it('returns null when end date equals start date', () => {
    const group = buildGroup('2024-01-01', '2024-01-01');
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toBeNull();
  });

  it('returns a dateRange error when end date is before start date', () => {
    const group = buildGroup('2024-01-10', '2024-01-05');
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toEqual({ dateRange: true });
  });

  it('returns null when either date is missing', () => {
    const group = buildGroup('', '2024-01-05');
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toBeNull();
  });
});

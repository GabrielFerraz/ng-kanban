import {
  addDays,
  daysBetween,
  durationInDays,
  endOfWeek,
  getIsoWeek,
  isWeekend,
  parseIsoDate,
  startOfDay,
  startOfWeek,
  toIsoDate,
} from './date.util';

describe('date.util', () => {
  describe('toIsoDate', () => {
    it('formats a date as yyyy-MM-dd', () => {
      expect(toIsoDate(new Date(2024, 0, 5))).toBe('2024-01-05');
    });

    it('pads single digit months and days', () => {
      expect(toIsoDate(new Date(2024, 8, 9))).toBe('2024-09-09');
    });
  });

  describe('parseIsoDate', () => {
    it('parses a yyyy-MM-dd string into a Date', () => {
      const result = parseIsoDate('2024-03-15');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2);
      expect(result?.getDate()).toBe(15);
    });

    it('returns null for an empty string', () => {
      expect(parseIsoDate('')).toBeNull();
    });

    it('returns null when a date part is missing', () => {
      expect(parseIsoDate('2024-03')).toBeNull();
    });
  });

  describe('startOfDay', () => {
    it('strips the time portion of a date', () => {
      const result = startOfDay(new Date(2024, 4, 10, 13, 45, 30));
      expect(result).toEqual(new Date(2024, 4, 10));
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(addDays(new Date(2024, 0, 1), 5)).toEqual(new Date(2024, 0, 6));
    });

    it('subtracts when given negative days', () => {
      expect(addDays(new Date(2024, 0, 10), -3)).toEqual(new Date(2024, 0, 7));
    });
  });

  describe('daysBetween', () => {
    it('computes the number of days between two dates', () => {
      expect(daysBetween(new Date(2024, 0, 1), new Date(2024, 0, 11))).toBe(10);
    });

    it('returns a negative value when "to" is before "from"', () => {
      expect(daysBetween(new Date(2024, 0, 11), new Date(2024, 0, 1))).toBe(-10);
    });
  });

  describe('durationInDays', () => {
    it('is inclusive of both start and end day', () => {
      expect(durationInDays(new Date(2024, 0, 1), new Date(2024, 0, 1))).toBe(1);
      expect(durationInDays(new Date(2024, 0, 1), new Date(2024, 0, 3))).toBe(3);
    });
  });

  describe('startOfWeek / endOfWeek', () => {
    it('returns the Monday of the week for a mid-week date', () => {
      // Wednesday 2024-01-10
      expect(startOfWeek(new Date(2024, 0, 10))).toEqual(new Date(2024, 0, 8));
    });

    it('returns the same date when already Monday', () => {
      expect(startOfWeek(new Date(2024, 0, 8))).toEqual(new Date(2024, 0, 8));
    });

    it('returns the Sunday ending the week', () => {
      expect(endOfWeek(new Date(2024, 0, 10))).toEqual(new Date(2024, 0, 14));
    });
  });

  describe('isWeekend', () => {
    it('returns true for Saturday and Sunday', () => {
      expect(isWeekend(new Date(2024, 0, 6))).toBeTrue(); // Saturday
      expect(isWeekend(new Date(2024, 0, 7))).toBeTrue(); // Sunday
    });

    it('returns false for weekdays', () => {
      expect(isWeekend(new Date(2024, 0, 8))).toBeFalse(); // Monday
    });
  });

  describe('getIsoWeek', () => {
    it('returns week 1 for the first week of the year', () => {
      expect(getIsoWeek(new Date(2024, 0, 4))).toBe(1);
    });

    it('returns the correct ISO week for a mid-year date', () => {
      expect(getIsoWeek(new Date(2024, 5, 17))).toBe(25);
    });
  });
});

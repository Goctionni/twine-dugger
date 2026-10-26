import { describe, expect, it } from 'vite-plus/test';

import { TYPE_KEY, type DateMarker } from '@/shared/json-safe';

import { parseDateText, stepDateText, toDateText } from './date-text';

const marker = (time: string) => `${TYPE_KEY}: Date ${time}` as DateMarker;

const error = (text: string) => {
  const parsed = parseDateText(text);
  if (!('error' in parsed)) throw new Error(`${text} should not be a date`);
  return parsed.error;
};

it('reads a date and time as the marker of that moment', () => {
  expect(parseDateText('2020-01-02 03:04:05')).toEqual({ marker: marker('2020-01-02T03:04:05') });
  expect(parseDateText('2033-12-31 23:59:59')).toEqual({ marker: marker('2033-12-31T23:59:59') });
});

it('is not strict about how it is written, as long as the parts are clear', () => {
  const expected = { marker: marker('2020-01-02T03:04:05') };
  expect(parseDateText('  2020-01-02 03:04:05  ')).toEqual(expected);
  expect(parseDateText('2020-01-02T03:04:05')).toEqual(expected);
  expect(parseDateText('2020-1-2 3:04:05')).toEqual(expected);
  // The seconds are left out: it is the start of the minute
  expect(parseDateText('2020-01-02 03:04')).toEqual({ marker: marker('2020-01-02T03:04:00') });
});

it('accepts the last day of a leap year, and a year before 100', () => {
  expect(parseDateText('2024-02-29 00:00:00')).toEqual({ marker: marker('2024-02-29T00:00:00') });
  expect(parseDateText('0099-05-06 07:08:09')).toEqual({ marker: marker('0099-05-06T07:08:09') });
});

it('asks for a date and time when there is nothing', () => {
  expect(error('')).toBe('A date and time are needed, like 2020-01-02 03:04:05');
  expect(error('   ')).toBe('A date and time are needed, like 2020-01-02 03:04:05');
});

it('says how to write it when the parts are not there', () => {
  const how = 'Write it as year-month-day hours:minutes:seconds, like 2020-01-02 03:04:05';
  expect(error('tomorrow')).toBe(how);
  expect(error('2020-01-02')).toBe(how);
  expect(error('02/01/2020 03:04:05')).toBe(how);
  expect(error('2020-01-02 03')).toBe(how);
  expect(error('20-01-02 03:04:05')).toBe(how);
});

it('says what is wrong with a part that is out of range', () => {
  expect(error('2020-13-02 03:04:05')).toBe('The month must be 1 to 12');
  expect(error('2020-00-02 03:04:05')).toBe('The month must be 1 to 12');
  expect(error('2020-01-02 24:04:05')).toBe('The hour must be 0 to 23');
  expect(error('2020-01-02 03:60:05')).toBe('The minutes and the seconds must be 0 to 59');
  expect(error('2020-01-02 03:04:60')).toBe('The minutes and the seconds must be 0 to 59');
});

it('says when the day is not on the calendar', () => {
  expect(error('2020-02-30 03:04:05')).toBe('2020-02 has no day 30');
  expect(error('2023-02-29 03:04:05')).toBe('2023-02 has no day 29');
  expect(error('2020-04-31 03:04:05')).toBe('2020-04 has no day 31');
  expect(error('2020-01-00 03:04:05')).toBe('2020-01 has no day 0');
});

it('shows a marker as the text that is typed, and an invalid Date as it is', () => {
  expect(toDateText(marker('2020-01-02T03:04:05'))).toBe('2020-01-02 03:04:05');
  expect(toDateText(marker('Invalid'))).toBe('Invalid Date');
});

describe('stepDateText', () => {
  const step = (text: string, caret: number, steps: number) => stepDateText(text, caret, steps);
  const start = '2020-06-15 12:30:45';

  it('changes the part that the caret is in or at the end of, and selects it', () => {
    expect(step(start, 2, 1)).toEqual({ text: '2021-06-15 12:30:45', selection: [0, 4] });
    expect(step(start, 4, 1)).toEqual({ text: '2021-06-15 12:30:45', selection: [0, 4] });
    expect(step(start, 5, 1)).toEqual({ text: '2020-07-15 12:30:45', selection: [5, 7] });
    expect(step(start, 9, -1)).toEqual({ text: '2020-06-14 12:30:45', selection: [8, 10] });
    expect(step(start, 11, 1)).toEqual({ text: '2020-06-15 13:30:45', selection: [11, 13] });
    expect(step(start, 15, 1)).toEqual({ text: '2020-06-15 12:31:45', selection: [14, 16] });
    expect(step(start, 19, -1)).toEqual({ text: '2020-06-15 12:30:44', selection: [17, 19] });
  });

  it('carries into the next part, like a clock', () => {
    expect(step('2020-12-31 23:59:59', 18, 1)).toEqual({
      text: '2021-01-01 00:00:00',
      selection: [17, 19],
    });
    expect(step('2020-01-01 00:00:00', 15, -1)).toEqual({
      text: '2019-12-31 23:59:00',
      selection: [14, 16],
    });
    expect(step('2020-06-30 12:00:00', 9, 1)?.text).toBe('2020-07-01 12:00:00');
    expect(step('2020-06-15 23:00:00', 12, 1)?.text).toBe('2020-06-16 00:00:00');
  });

  it('keeps the day inside the month when the month or the year changes', () => {
    expect(step('2020-01-31 12:00:00', 6, 1)?.text).toBe('2020-02-29 12:00:00');
    expect(step('2021-01-31 12:00:00', 6, 1)?.text).toBe('2021-02-28 12:00:00');
    expect(step('2020-03-31 12:00:00', 6, -1)?.text).toBe('2020-02-29 12:00:00');
    expect(step('2020-02-29 12:00:00', 2, 1)?.text).toBe('2021-02-28 12:00:00');
    expect(step('2020-12-15 12:00:00', 6, 1)?.text).toBe('2021-01-15 12:00:00');
  });

  it('takes bigger steps', () => {
    expect(step(start, 15, 10)?.text).toBe('2020-06-15 12:40:45');
    expect(step(start, 9, -10)?.text).toBe('2020-06-05 12:30:45');
  });

  it('writes the whole text as the field has it: the seconds that were left out, and a T', () => {
    expect(step('2020-6-5 3:04', 14, 1)).toEqual({
      text: '2020-06-05 03:05:00',
      selection: [14, 16],
    });
    expect(step('2020-06-05T03:04:05', 2, 1)?.text).toBe('2021-06-05 03:04:05');
  });

  it('is on the nearest part to the left when the caret is not in one, and on the first before them', () => {
    expect(step('2020-06-15 12:30:45  ', 21, 1)?.text).toBe('2020-06-15 12:30:46');
    expect(step('  2020-06-15 12:30:45', 0, 1)?.text).toBe('2021-06-15 12:30:45');
  });

  it('does nothing for text that is not a date, or when the year goes out of range', () => {
    expect(step('tomorrow', 2, 1)).toBeUndefined();
    expect(step('2020-02-30 12:00:00', 2, 1)).toBeUndefined();
    expect(step('', 0, 1)).toBeUndefined();
    expect(step('9999-06-15 12:00:00', 2, 1)).toBeUndefined();
    expect(step('0000-06-15 12:00:00', 2, -1)).toBeUndefined();
  });
});

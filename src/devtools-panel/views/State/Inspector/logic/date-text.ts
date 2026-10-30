import { fromDateMarker, getDateText, toDateMarker, type DateMarker } from '@/shared/json-safe';

const EXAMPLE = '2020-01-02 03:04:05';
// Not strict about the separator or the number of digits of a part; the seconds can be left out
const PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export type ParsedDate = { marker: DateMarker } | { error: string };

const two = (part: number) => String(part).padStart(2, '0');

/** The marker for a date and time as it is typed, or what is wrong with the text */
export function parseDateText(text: string): ParsedDate {
  const trimmed = text.trim();
  if (!trimmed) return { error: `A date and time are needed, like ${EXAMPLE}` };

  const parts = PATTERN.exec(trimmed);
  if (!parts) {
    return { error: `Write it as year-month-day hours:minutes:seconds, like ${EXAMPLE}` };
  }
  const [Y, M, D, h, m, s] = [
    parts[1],
    parts[2],
    parts[3],
    parts[4],
    parts[5],
    parts[6] ?? '0',
  ].map(Number) as [number, number, number, number, number, number];

  if (M < 1 || M > 12) return { error: 'The month must be 1 to 12' };
  if (h > 23) return { error: 'The hour must be 0 to 23' };
  if (m > 59 || s > 59) return { error: 'The minutes and the seconds must be 0 to 59' };

  // The date the parts make: another month or day when the day is not on the calendar
  const date = new Date(2000, 0, 1, h, m, s);
  date.setFullYear(Y, M - 1, D);
  if (date.getMonth() !== M - 1 || date.getDate() !== D) {
    return { error: `${Y}-${two(M)} has no day ${D}` };
  }
  // The hour that the clocks skip when they go forward
  if (date.getHours() !== h) {
    return { error: 'That time does not exist here: the clocks go forward at that moment' };
  }
  return { marker: toDateMarker(date) };
}

/** What a Date is shown as in the field */
export const toDateText = (marker: DateMarker) => getDateText(marker);

// Where the parts are in the text as it is written back: year, month, day, hours, minutes, seconds
const PART_RANGES = [
  [0, 4],
  [5, 7],
  [8, 10],
  [11, 13],
  [14, 16],
  [17, 19],
] as const;

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month + 1, 0);
  return date.getDate();
};

/** Months later, or earlier; a day that the month does not have becomes its last day */
function addMonths(date: Date, months: number) {
  const total = date.getFullYear() * 12 + date.getMonth() + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  const next = new Date(date);
  next.setFullYear(year, month, Math.min(date.getDate(), getDaysInMonth(year, month)));
  return next;
}

/**
 * The text with the part that the caret is in (or at the end of, else the nearest on its left)
 * changed by `steps`, and where that part is in the new text. A change carries into the next part,
 * like a clock does. Nothing when the text is not a date, or the year would leave 0 to 9999.
 */
export function stepDateText(
  text: string,
  caret: number,
  steps: number,
): { text: string; selection: [start: number, end: number] } | undefined {
  const parsed = parseDateText(text);
  if (!('marker' in parsed)) return undefined;

  const runs = [...text.matchAll(/\d+/g)].map((run) => ({
    start: run.index,
    end: run.index + run[0].length,
  }));
  let part = runs.findIndex((run) => run.start <= caret && caret <= run.end);
  if (part < 0) part = runs.findLastIndex((run) => run.end < caret);
  part = Math.max(part, 0);

  const date = fromDateMarker(parsed.marker);
  let next = new Date(date);
  if (part === 0) next = addMonths(date, steps * 12);
  else if (part === 1) next = addMonths(date, steps);
  else if (part === 2) next.setDate(date.getDate() + steps);
  else if (part === 3) next.setHours(date.getHours() + steps);
  else if (part === 4) next.setMinutes(date.getMinutes() + steps);
  else next.setSeconds(date.getSeconds() + steps);

  if (next.getFullYear() < 0 || next.getFullYear() > 9999) return undefined;
  return { text: toDateText(toDateMarker(next)), selection: [...PART_RANGES[part]!] };
}

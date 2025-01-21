import type { DateRange } from './common-types.js';

const DATE_REVIVE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DATE_EXTRACT_REGEX_YYYYMMDD = /^(.*)(2\d{3})[^\d]?([0-1]\d)[^\d]?([0-3]\d)(.*)$/;
const DATE_EXTRACT_REGEX_DDMMYYYY = /^(.*)([0-3]\d)[^\d]?([0-1]\d)[^\d]?(2\d{3})(.*)$/;

export function dateToString(date: Date, includeTime?: boolean) {
  const str = date
    .toISOString()
    .slice(0, 19)
    .replace('T', '-')
    .replace(/:/g, '-')
    .replace(/-00-00-00$/, '');

  return includeTime ? str : str.slice(0, 10);
}

export function stringToDate(value: string) {
  const isoString = value.replace(
    /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)-(\d\d))?(\..*)?$/,
    (...args) => `${args[1]}-${args[2]}-${args[3]}T${args[4] || '00'}:${args[5] || '00'}:${args[6] || '00'}Z`,
  );

  return new Date(isoString);
}

export function extractDateFromString(value: string): [date: Date | undefined, rest: string] {
  let match = DATE_EXTRACT_REGEX_YYYYMMDD.exec(value);
  let before, year, month, day, after;

  if (match) {
    [, before, year, month, day, after] = match;
  } else {
    match = DATE_EXTRACT_REGEX_DDMMYYYY.exec(value);
    if (match) {
      [, before, day, month, year, after] = match;
    } else {
      return [undefined, value];
    }
  }

  return [new Date(`${year}-${month}-${day}T00:00:00Z`), `${before ?? ''}${after ?? ''}`];
}

export function getDaysPassed(fromDate: Date) {
  return Math.floor((Date.now() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function getHoursPassed(fromDate: Date) {
  return Math.floor((Date.now() - fromDate.getTime()) / (1000 * 60 * 60));
}

export function getMinutesPassed(fromDate: Date) {
  return Math.floor((Date.now() - fromDate.getTime()) / (1000 * 60));
}

export function getDayOfYear(date: Date) {
  const startTime = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - startTime;
  const oneDay = 1000 * 60 * 60 * 24;

  return Math.floor(diff / oneDay);
}

export function getSecondOfDay(date: Date) {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return hours * 60 * 60 + minutes * 60 + seconds;
}

// TODO: use or delete
export function getVersionFromDate(date: Date) {
  return `${date.getUTCFullYear()}.${getDayOfYear(date)}.${getSecondOfDay(date)}`;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function formatDate(date: Date, locale = 'en-GB') {
  return date.toLocaleDateString(locale, { timeZone: 'UTC' });
}

export function formatTime(date: Date, includeSeconds?: boolean, locale = 'en-GB') {
  return date.toLocaleTimeString(locale, { timeZone: 'UTC', timeStyle: !includeSeconds ? 'short' : undefined });
}

export function getDecade(date: Date) {
  return Math.floor(date.getUTCFullYear() / 10);
}

export function getDecadeYearRange(decade: number): [number, number] {
  return [decade * 10, decade * 10 + 9];
}

export function isDateInRange(date: Date, range: DateRange, granularity: 'year' | 'month' | 'date') {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const startYear = range[0].getUTCFullYear();
  const startMonth = range[0].getUTCMonth();
  const startDay = range[0].getUTCDate();

  if (!range[1]) {
    switch (granularity) {
      case 'year':
        return year === startYear;
      case 'month':
        return year === startYear && month === startMonth;
      case 'date':
        return year === startYear && month === startMonth && day === startDay;
      default:
        return false;
    }
  }

  const endYear = range[1].getUTCFullYear();
  const endMonth = range[1].getUTCMonth();
  const endDay = range[1].getUTCDate();

  switch (granularity) {
    case 'year':
      return year >= startYear && year <= endYear;
    case 'month':
      return (
        (year > startYear || (year === startYear && month >= startMonth)) &&
        (year < endYear || (year === endYear && month <= endMonth))
      );
    case 'date':
      return (
        (year > startYear ||
          (year === startYear && month > startMonth) ||
          (year === startYear && month === startMonth && day >= startDay)) &&
        (year < endYear ||
          (year === endYear && month < endMonth) ||
          (year === endYear && month === endMonth && day <= endDay))
      );
    default:
  }

  return false;
}

export function dateRangeToString(range: DateRange) {
  const startStr = dateToString(range[0]);
  const endStr = range[1] ? dateToString(range[1]) : undefined;

  if (!endStr || startStr === endStr) {
    return startStr;
  }

  return `${startStr},${endStr}`;
}

export function stringToDateRange(value: string): DateRange | undefined {
  const parts = value
    .split(',')
    .map((string) => stringToDate(string))
    .filter(isValidDate);

  return parts[0] ? [parts[0], parts[1] || undefined] : undefined;
}

export function jsonDateReviver(_key: string, value: unknown) {
  if (typeof value === 'string' && DATE_REVIVE_REGEX.test(value)) {
    return new Date(value);
  }

  return value;
}

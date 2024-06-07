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

export function isValidDate(value: unknown) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

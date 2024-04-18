import assert from 'assert';
import { afterEach, mock, test } from 'node:test';
import {
  dateToString,
  extractDateFromString,
  getDaysPassed,
  getHoursPassed,
  getVersionFromDate,
  stringToDate,
} from './date-utils.js';

afterEach(() => {
  mock.timers.reset();
});

test('extractDateFromString', async (t) => {
  await t.test('should return a Date object and the remaining string for string including YYYY-MM-DD', () => {
    const input = ' first 2023-02-14 and other words';
    const [date, rest] = extractDateFromString(input);

    assert.strictEqual(date?.getTime(), new Date('2023-02-14T00:00:00.000Z').getTime());
    assert.strictEqual(rest, ' first  and other words');
  });

  await t.test('should return a Date object and the remaining string for string including DD/MM/YYYY', () => {
    const input = ' first 14/02/2023 and other words';
    const [date, rest] = extractDateFromString(input);

    assert.strictEqual(date?.getTime(), new Date('2023-02-14T00:00:00.000Z').getTime());
    assert.strictEqual(rest, ' first  and other words');
  });

  await t.test('should return undefined and the original string for strings not including a date', () => {
    const input = 'string does not include a date';
    const [date, rest] = extractDateFromString(input);

    assert.strictEqual(date, undefined);
    assert.strictEqual(rest, input);
  });
});

test('stringToDate', async (t) => {
  await t.test('should return a date object for a valid date string', () => {
    const date = stringToDate('2023-02-14');
    assert.strictEqual(date.getTime(), new Date('2023-02-14T00:00:00.000Z').getTime());
  });

  await t.test('should return invalid date for an invalid date string', () => {
    const date = stringToDate('not a date');
    assert(Number.isNaN(date.getTime()));
  });
});

test('dateToString', async (t) => {
  await t.test('should return a string in the format YYYY-MM-DD', () => {
    const date = new Date('2022-02-10T12:43:59Z');
    const result = dateToString(date);

    assert.strictEqual(result, '2022-02-10');
  });

  await t.test('should return a string in the format YYYY-MM-DD-HH-mm-ss if includeTime is true', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2023-05-14T11:01:58.135Z') });

    const date = new Date('2022-02-10T12:43:59Z');
    const result = dateToString(date, true);

    assert.strictEqual(result, '2022-02-10-12-43-59');
  });
});

test('getHoursPassed', async (t) => {
  await t.test('should return the number of hours passed since the given date', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2023-02-14T11:01:58Z') });

    const date = new Date('2023-02-10T12:10:46Z');
    const hoursPassed = getHoursPassed(date);
    assert.strictEqual(hoursPassed, 94);
  });
});

test('getDaysPassed', async (t) => {
  await t.test('should return the number of days passed since the given date', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2023-02-14T11:01:58Z') });

    const date = new Date('2023-02-10T12:10:46Z');
    const daysPassed = getDaysPassed(date);
    assert.strictEqual(daysPassed, 3);
  });
});

test('getVersionFromDate', async (t) => {
  await t.test('should return version string in format YYYY.D.S for given date', () => {
    const version1 = getVersionFromDate(new Date('2022-01-01T00:00:00Z'));
    const version2 = getVersionFromDate(new Date('2024-02-01T00:01:21Z'));

    assert.strictEqual(version1, '2022.1.0');
    assert.strictEqual(version2, '2024.32.81');
  });
});

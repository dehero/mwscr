import type { PostEntries } from '../entities/post.js';
import { getPostDateById, getPostLastPublished } from '../entities/post.js';
import type { Rule } from '../entities/rule.js';
import { getDaysPassed, getHoursPassed, isValidDate } from '../utils/date-utils.js';

export type PostingRule = Rule<undefined, PostEntries>;

export function onWeekDay(weekDay: number): PostingRule {
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentWeekDay = new Date().getUTCDay();

  return (_value: unknown) => {
    if (currentWeekDay !== weekDay) {
      return `need current day to be ${weekDays[weekDay]}, got ${weekDays[currentWeekDay]}`;
    }
    return undefined;
  };
}

export function afterHour(hour: number): PostingRule {
  const currentHour = new Date().getUTCHours();

  return (_value: unknown) => {
    if (currentHour < hour) {
      return `need current hour to be greater than ${hour}, got ${currentHour}`;
    }
    return undefined;
  };
}

export function lastPublishedHoursAgo(hours: number): PostingRule {
  return (_value: unknown, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    const [, post] = postEntries[0] ?? [];
    if (!post) {
      return undefined;
    }

    const lastPublished = getPostLastPublished(post);
    if (!lastPublished) {
      return undefined;
    }

    const hoursPassed = getHoursPassed(lastPublished);
    if (hoursPassed < hours) {
      return `need last publication to be older than ${hours} hours, got ${hoursPassed}`;
    }

    return undefined;
  };
}

export function lastPostedDaysAgo(days: number): PostingRule {
  return (_value: unknown, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    const [id] = postEntries[0] ?? [];
    if (!id) {
      return undefined;
    }

    const date = getPostDateById(id);
    if (!isValidDate(date)) {
      return undefined;
    }

    const daysPassed = getDaysPassed(date);
    if (daysPassed < days) {
      return `need last post to be older than ${days} days, got ${daysPassed}`;
    }

    return undefined;
  };
}

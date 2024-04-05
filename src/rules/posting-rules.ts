import type { PostEntries } from '../entities/post.js';
import { getPostLastPublished } from '../entities/post.js';
import type { Rule } from '../entities/rule.js';
import { getHoursPassed } from '../utils/date-utils.js';

export type PostingRule = Rule<undefined, PostEntries>;

export function onWeekDay(weekDay: number): PostingRule {
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentWeekDay = new Date().getUTCDay();

  return (_value: unknown): _value is undefined => {
    if (currentWeekDay !== weekDay) {
      throw new Error(`need current day to be ${weekDays[weekDay]}, got ${weekDays[currentWeekDay]}`);
    }
    return true;
  };
}

export function afterHour(hour: number) {
  const currentHour = new Date().getUTCHours();

  return (_value: unknown): _value is undefined => {
    if (currentHour < hour) {
      throw new Error(`need current hour to be greater than ${hour}, got ${currentHour}`);
    }
    return true;
  };
}

export function lastPostedHoursAgo(hours: number) {
  return (_value: unknown, postEntries?: PostEntries): _value is undefined => {
    if (!postEntries) {
      return false;
    }

    const [, post] = postEntries[0] ?? [];
    if (!post) {
      return true;
    }

    const lastPublished = getPostLastPublished(post);
    if (!lastPublished) {
      return true;
    }

    const hoursPassed = getHoursPassed(lastPublished);
    if (hoursPassed < hours) {
      throw new Error(`need last publication to be older than ${hours} hours, got ${hoursPassed}`);
    }

    return true;
  };
}

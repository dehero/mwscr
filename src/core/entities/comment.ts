import type { InferOutput } from 'valibot';
import { date, nonEmpty, object, pipe, string, trim } from 'valibot';
import type { SortDirection } from '../utils/common-types.js';

export const Comment = object({
  datetime: date(),
  author: pipe(string(), nonEmpty()),
  text: pipe(string(), trim()),
});
export type Comment = InferOutput<typeof Comment>;

export type CommentsComparator = (a: Comment, b: Comment) => number;

export function compareCommentsByDatetime(direction: SortDirection): CommentsComparator {
  return direction === 'asc'
    ? (a, b) => a.datetime.getTime() - b.datetime.getTime()
    : (a, b) => b.datetime.getTime() - a.datetime.getTime();
}

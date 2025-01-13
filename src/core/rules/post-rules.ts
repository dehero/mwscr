import type { Post, PostType } from '../entities/post.js';
import type { Rule } from '../entities/rule.js';
import { asArray, listItems } from '../utils/common-utils.js';

export type PostRule = Rule<Post>;

export function needCertainAuthor<T extends Post>(postAuthor: string) {
  return (post: T): post is T & { author: string | string[] } => {
    const authors = asArray(post.author);
    if (!authors.includes(postAuthor)) {
      throw new Error(`need one of authors to be "${postAuthor}", got ${listItems(authors, true)}`);
    }
    return true;
  };
}

export function needCertainType<T extends Post>(...postTypes: PostType[]) {
  return (post: T): post is T => {
    if (!postTypes.includes(post.type)) {
      throw new Error(`need post type to be ${listItems(postTypes, true)}, got "${post.type}"`);
    }
    return true;
  };
}

// export function needCertainMark<T extends Post, TMarks extends PostMark[]>(...marks: TMarks) {
//   return (post: T): post is T & { mark: TMarks[number] } => {
//     if (!needMark(post)) {
//       return false;
//     }

//     if (!marks.includes(post.mark)) {
//       throw new Error(`need mark to be ${listItems(marks)}, got "${post.mark}"`);
//     }

//     return true;
//   };
// }

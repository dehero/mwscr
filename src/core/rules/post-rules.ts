import type { Post, PostMark, PostType } from '../entities/post.js';
import type { Rule } from '../entities/rule.js';
import { asArray, listItems } from '../utils/common-utils.js';

export type PostRule = Rule<Post>;

export function needCertainAuthor(postAuthor: string): PostRule {
  return (post: Post) => {
    const authors = asArray(post.author);
    if (!authors.includes(postAuthor)) {
      return `need one of authors to be "${postAuthor}", got ${listItems(authors, true)}`;
    }

    return undefined;
  };
}

export function needCertainType(...postTypes: PostType[]): PostRule {
  return (post: Post) => {
    if (!postTypes.includes(post.type)) {
      return `need post type to be ${listItems(postTypes, true)}, got "${post.type}"`;
    }

    return undefined;
  };
}

export function needCertainMark(...marks: PostMark[]): PostRule {
  return (post: Post) => {
    if (!post.mark) {
      return undefined;
    }

    if (!marks.includes(post.mark)) {
      return `need mark to be ${listItems(marks)}, got "${post.mark}"`;
    }

    return undefined;
  };
}

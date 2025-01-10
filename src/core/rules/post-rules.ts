import type { Post, PostMark, PostType, PostViolation } from '../entities/post.js';
import { getPostTypesFromContent } from '../entities/post.js';
import { postTitleFromString } from '../entities/post-title.js';
import type { Publication } from '../entities/publication.js';
import type { Rule } from '../entities/rule.js';
import { needObject, needProperty } from '../entities/rule.js';
import { asArray, listItems } from '../utils/common-utils.js';
import type { AugmentedRequired } from '../utils/type-utils.js';

export type PostRule = Rule<Post>;

export function needTitle(post: Post): post is AugmentedRequired<Post, 'title'> {
  if (!(typeof post.title === 'string' && post.title.length > 0)) {
    throw new Error('need english title');
  }
  return true;
}

export function needRightTitle(post: Post): post is AugmentedRequired<Post, 'title'> {
  if (!needTitle(post)) {
    return false;
  }

  const rightTitle = postTitleFromString(post.title);

  if (rightTitle !== post.title) {
    throw new Error(`need english title to be "${rightTitle}", got "${post.title}"`);
  }

  return true;
}

export function needTitleRu(post: Post): post is AugmentedRequired<Post, 'titleRu'> {
  if (!(typeof post.titleRu === 'string' && post.titleRu.length > 0)) {
    throw new Error('need russian title');
  }
  return true;
}

export function needAuthor(post: Post): post is AugmentedRequired<Post, 'author'> {
  if (!((typeof post.author === 'string' || Array.isArray(post.author)) && post.author.length > 0)) {
    throw new Error('need author');
  }
  return true;
}

export function needCertainAuthor<T extends Post>(postAuthor: string) {
  return (post: T): post is T & { author: string | string[] } => {
    const authors = asArray(post.author);
    if (!authors.includes(postAuthor)) {
      throw new Error(`need one of authors to be "${postAuthor}", got ${listItems(authors, true)}`);
    }
    return true;
  };
}

export function needRequest(post: Post): post is AugmentedRequired<Post, 'request'> {
  // TODO: improve request field check
  return needObject(post.request) && needProperty('user', 'string')(post.request);
}

export function needCertainType<T extends Post>(...postTypes: PostType[]) {
  return (post: T): post is T => {
    if (!postTypes.includes(post.type)) {
      throw new Error(`need post type to be ${listItems(postTypes, true)}, got "${post.type}"`);
    }
    return true;
  };
}

export function needProperType<T extends Post>(post: T): post is T {
  const possibleTypes = getPostTypesFromContent(post.content);

  if (!possibleTypes.includes(post.type)) {
    throw new Error(
      possibleTypes.length === 0
        ? 'unable to detect possible post type from content'
        : `detected post type ${listItems(possibleTypes, true)}, got "${post.type}"`,
    );
  }
  return true;
}

export function needContent(post: Post): post is Post & { content: string | string[] } {
  if (
    !(
      typeof post.content === 'string' ||
      (Array.isArray(post.content) && post.content.every((url) => typeof url === 'string'))
    )
  ) {
    throw new Error('need content');
  }
  return true;
}

export function needTrash(post: Post): post is Post & { trash: string | string[] } {
  if (
    !(
      typeof post.trash === 'string' ||
      (Array.isArray(post.trash) && post.trash.every((url) => typeof url === 'string'))
    )
  ) {
    throw new Error('need trash');
  }
  return true;
}

export function needMark(post: Post): post is AugmentedRequired<Post, 'mark'> {
  if (typeof post.mark !== 'string') {
    throw new TypeError('need mark');
  }
  return true;
}

export function needCertainMark<T extends Post, TMarks extends PostMark[]>(...marks: TMarks) {
  return (post: T): post is T & { mark: TMarks[number] } => {
    if (!needMark(post)) {
      return false;
    }

    if (!marks.includes(post.mark)) {
      throw new Error(`need mark to be ${listItems(marks)}, got "${post.mark}"`);
    }

    return true;
  };
}

export function needViolation(post: Post): post is Post & { violation: PostViolation } {
  if (typeof post.violation !== 'string') {
    throw new TypeError('need violation');
  }
  return true;
}

export function needLocation(post: Post): post is AugmentedRequired<Post, 'location'> {
  if (!((typeof post.location === 'string' || Array.isArray(post.location)) && post.location.length > 0)) {
    throw new TypeError('need location');
  }
  return true;
}

export function needPublications(post: Post): post is Post & { posts: Publication[] } {
  if (!Array.isArray(post.posts) || post.posts.length === 0) {
    throw new Error('need published service posts');
  }

  return true;
}

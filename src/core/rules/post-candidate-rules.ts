import type { PostEntries, PostMark } from '../entities/post.js';
import {
  getPostAuthorDistance,
  getPostContentDistance,
  getPostMarkDistance,
  getPostRelatedLocationDistance,
  getPostTypeDistance,
} from '../entities/post.js';
import type { PublishablePost } from '../entities/posts-manager.js';
import type { Rule } from '../entities/rule.js';

export type PostCandidateRule = Rule<PublishablePost, PostEntries>;

export function needMinContentDistance(minContentDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    const { distance, message } = getPostContentDistance(post.content, postEntries);

    if (distance < minContentDistance) {
      return `${message}, expected minimum ${minContentDistance}`;
    }

    return undefined;
  };
}

export function needMinTypeDistance(minTypeDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    const { distance, message } = getPostTypeDistance(post.type, postEntries);

    if (distance < minTypeDistance) {
      return `${message}, expected minimum ${minTypeDistance}`;
    }

    return undefined;
  };
}

export function needMinAuthorDistance(minAuthorDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!post.author || !postEntries) {
      return undefined;
    }

    const { distance, message } = getPostAuthorDistance(post.author, postEntries);

    if (distance < minAuthorDistance) {
      return `${message}, expected minimum ${minAuthorDistance}`;
    }

    return undefined;
  };
}

export function needMinMarkDistance(mark: PostMark, minMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    if (post.mark !== mark) {
      return undefined;
    }

    const { distance, message } = getPostMarkDistance(post.mark, postEntries);

    if (distance < minMarkDistance) {
      return `${message}, expected minimum ${minMarkDistance}`;
    }

    return undefined;
  };
}

export function needMaxMarkDistance(mark: PostMark, maxMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    const { distance } = getPostMarkDistance(mark, postEntries);

    if (distance > maxMarkDistance && post.mark !== mark) {
      return `need mark ${mark}, got ${post.mark}`;
    }

    return undefined;
  };
}

export function needMinRelatedLocationDistance(minLocationDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries) => {
    if (!postEntries) {
      return undefined;
    }

    if (!post.location) {
      return undefined;
    }

    const { distance, message } = getPostRelatedLocationDistance(post.location, postEntries);
    if (distance < minLocationDistance) {
      return `${message}, expected minimum ${minLocationDistance}`;
    }

    return undefined;
  };
}

import type { PostEntries, PostMark } from '../entities/post.js';
import {
  getPostAuthorDistance,
  getPostContentDistance,
  getPostMarkDistance,
  getPostRelatedLocationDistance,
  getPostTypeDistance,
} from '../entities/post.js';
import type { PublishablePost } from '../entities/post-variation.js';
import type { Rule } from '../entities/rule.js';

export type PostCandidateRule = Rule<PublishablePost, PostEntries>;

export function needMinContentDistance(minContentDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!postEntries) {
      return false;
    }

    const { distance, message } = getPostContentDistance(post.content, postEntries);

    if (distance < minContentDistance) {
      throw new Error(`${message}, expected minimum ${minContentDistance}`);
    }
    return true;
  };
}

export function needMinTypeDistance(minTypeDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!postEntries) {
      return false;
    }

    const { distance, message } = getPostTypeDistance(post.type, postEntries);

    if (distance < minTypeDistance) {
      throw new Error(`${message}, expected minimum ${minTypeDistance}`);
    }
    return true;
  };
}

export function needMinAuthorDistance(minAuthorDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!post.author || !postEntries) {
      return false;
    }

    const { distance, message } = getPostAuthorDistance(post.author, postEntries);

    if (distance < minAuthorDistance) {
      throw new Error(`${message}, expected minimum ${minAuthorDistance}`);
    }
    return true;
  };
}

export function needMinMarkDistance(mark: PostMark, minMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!postEntries) {
      return false;
    }

    if (post.mark !== mark) {
      return true;
    }

    const { distance, message } = getPostMarkDistance(post.mark, postEntries);

    if (distance < minMarkDistance) {
      throw new Error(`${message}, expected minimum ${minMarkDistance}`);
    }
    return true;
  };
}

export function needMaxMarkDistance(mark: PostMark, maxMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!postEntries) {
      return false;
    }

    const { distance } = getPostMarkDistance(mark, postEntries);

    if (distance > maxMarkDistance && post.mark !== mark) {
      throw new Error(`need mark ${mark}, got ${post.mark}`);
    }

    return true;
  };
}

export function needMinRelatedLocationDistance(minLocationDistance: number): PostCandidateRule {
  return (post: PublishablePost, postEntries?: PostEntries): post is PublishablePost => {
    if (!postEntries) {
      return false;
    }

    if (!post.location) {
      return true;
    }

    const { distance, message } = getPostRelatedLocationDistance(post.location, postEntries);
    if (distance < minLocationDistance) {
      throw new Error(`${message}, expected minimum ${minLocationDistance}`);
    }

    return true;
  };
}

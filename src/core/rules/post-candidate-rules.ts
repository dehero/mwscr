import type { PostMark } from '../entities/post.js';
import {
  getPostAuthorDistance,
  getPostContentDistance,
  getPostDateById,
  getPostIdDistance,
  getPostMarkDistance,
  getPostRelatedLocationDistance,
  getPostThirdPartyDistance,
  getPostTypeDistance,
  postAddonDescriptors,
} from '../entities/post.js';
import type { PublishablePost } from '../entities/posts-manager.js';
import type { Rule } from '../entities/rule.js';
import { getDaysPassed } from '../utils/date-utils.js';
import type { PostingRuleContext } from './posting-rules.js';

export type PostCandidateRule = Rule<PublishablePost, PostingRuleContext>;

export function needMinContentDistance(minContentDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context || !post.content) {
      return undefined;
    }

    const { distance, message } = getPostContentDistance(
      post.content,
      context.publicPostEntries[context.targetManager],
    );

    if (distance < minContentDistance) {
      return `${message}, expected minimum ${minContentDistance}`;
    }

    return undefined;
  };
}

export function needMinTypeDistance(minTypeDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context) {
      return undefined;
    }

    const { distance, message } = getPostTypeDistance(post.type, context.publicPostEntries[context.targetManager]);

    if (distance < minTypeDistance) {
      return `${message}, expected minimum ${minTypeDistance}`;
    }

    return undefined;
  };
}

export function needMinTypeDaysAgo(minDaysAgo: number): PostCandidateRule {
  return ({ type }: PublishablePost, context?: PostingRuleContext) => {
    if (!context) {
      return undefined;
    }

    for (const [id, post] of context.publicPostEntries[context.targetManager]) {
      if (post.type !== type) {
        continue;
      }
      const date = getPostDateById(id);
      if (!date) {
        continue;
      }
      const daysAgo = getDaysPassed(date);
      if (daysAgo < minDaysAgo) {
        return `found type "${type}" in "${id}" ${daysAgo} days ago, expected minimum ${minDaysAgo}`;
      }
      return undefined;
    }
    return undefined;
  };
}

export function needMinAuthorDistance(minAuthorDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!post.author || !context) {
      return undefined;
    }

    const { distance, message } = getPostAuthorDistance(post.author, context.publicPostEntries[context.targetManager]);

    if (distance < minAuthorDistance) {
      return `${message}, expected minimum ${minAuthorDistance}`;
    }

    return undefined;
  };
}

export function needMinMarkDistance(mark: PostMark, minMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context) {
      return undefined;
    }

    if (post.mark !== mark) {
      return undefined;
    }

    const { distance, message } = getPostMarkDistance(post.mark, context.publicPostEntries[context.targetManager]);

    if (distance < minMarkDistance) {
      return `${message}, expected minimum ${minMarkDistance}`;
    }

    return undefined;
  };
}

export function needMaxMarkDistance(mark: PostMark, maxMarkDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context) {
      return undefined;
    }

    const { distance } = getPostMarkDistance(mark, context.publicPostEntries[context.targetManager]);

    if (distance > maxMarkDistance && post.mark !== mark) {
      return `need mark ${mark}, got ${post.mark}`;
    }

    return undefined;
  };
}

export function needMinRelatedLocationDistance(minLocationDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context?.publicPostEntries) {
      return undefined;
    }

    if (!post.location) {
      return undefined;
    }

    const { distance, message } = getPostRelatedLocationDistance(
      post.location,
      context.publicPostEntries[context.targetManager],
    );
    if (distance < minLocationDistance) {
      return `${message}, expected minimum ${minLocationDistance}`;
    }

    return undefined;
  };
}

export function needMinThirdPartyDistance(minThirdPartyDistance: number): PostCandidateRule {
  return (post: PublishablePost, context?: PostingRuleContext) => {
    if (!context) {
      return undefined;
    }

    if (!post.addon || postAddonDescriptors[post.addon].official) {
      return undefined;
    }

    const { distance, message } = getPostThirdPartyDistance(context.publicPostEntries[context.targetManager]);

    if (distance < minThirdPartyDistance) {
      return `${message}, expected minimum ${minThirdPartyDistance}`;
    }

    return undefined;
  };
}

export function needAnnouncement(post: PublishablePost, context?: PostingRuleContext): string | undefined {
  if (!context) {
    return undefined;
  }

  if (!post.announcement) {
    return `announcement is required`;
  }

  const { distance, message } = getPostIdDistance(post.announcement, context.publicPostEntries.extras);

  if (distance === Infinity) {
    return `${message}, but expected as announcement`;
  }

  return undefined;
}

import {
  needAuthor,
  needCertainMark,
  needContent,
  needProperType,
  needPublications,
  needRequest,
  needRightTitle,
  needTitleRu,
  needViolation,
} from '../rules/post-rules.js';
import type { AugmentedRequired } from '../utils/type-utils.js';
import type { Post } from './post.js';
import { checkRules } from './rule.js';

export type PostCheck<TPost extends Post> = (post: Post, errors?: string[]) => post is TPost;

export function combinePostChecks<TPost extends Post>(
  checks: PostCheck<TPost>[],
  post: Post,
  errors?: string[],
): post is TPost {
  if (checks.length === 0) {
    return true;
  }
  const allErrors: string[] = [];

  for (const check of checks) {
    const checkErrors: string[] = [];
    const result = check(post, checkErrors);

    if (result) {
      return true;
    }
    allErrors.push(checkErrors.join(', '));
  }

  if (allErrors.length > 0) {
    errors?.push(allErrors.join(' OR '));
  }

  return false;
}

export type ViolatingPost = AugmentedRequired<Post, 'violation'>;

export function isViolatingPost(post: Post, errors?: string[]): post is ViolatingPost {
  return checkRules([needViolation], post, errors);
}

export interface OrdinaryPost extends Post {
  mark: 'D' | 'F';
}

export function isOrdinaryPost(post: Post, errors?: string[]): post is OrdinaryPost {
  return checkRules([needCertainMark('D', 'F')], post, errors);
}

export type TrashItem = ViolatingPost | OrdinaryPost;

export function isTrashItem(post: Post, errors?: string[]): post is TrashItem {
  return combinePostChecks<TrashItem>([isOrdinaryPost, isViolatingPost], post, errors);
}

export type PublishablePost = AugmentedRequired<Post, 'title' | 'titleRu' | 'author' | 'content'> & {
  mark: 'A1' | 'A2' | 'B1' | 'B2' | 'C' | 'E';
};

export function isPublishablePost(post: Post, errors?: string[]): post is PublishablePost {
  return checkRules(
    [
      needRightTitle,
      needTitleRu,
      needAuthor,
      needContent,
      needCertainMark('A1', 'A2', 'B1', 'B2', 'C', 'E'),
      needProperType,
    ],
    post,
    errors,
  );
}

export type PublishedPost = PublishablePost & AugmentedRequired<Post, 'posts'>;

export function isPublishedPost(post: Post, errors?: string[]): post is PublishedPost {
  return checkRules(
    [
      needRightTitle,
      needTitleRu,
      needAuthor,
      needContent,
      needCertainMark('A1', 'A2', 'B1', 'B2', 'C', 'E'),
      needProperType,
      needPublications,
    ],
    post,
    errors,
  );
}

export type PostDraft = AugmentedRequired<Post, 'content' | 'author'>;

export function isPostDraft(post: Post, errors?: string[]): post is PostDraft {
  return checkRules([needContent, needAuthor], post, errors);
}

export type PostRequest = AugmentedRequired<Post, 'request'>;

export function isPostRequest(post: Post, errors?: string[]): post is PostRequest {
  return checkRules([needRequest], post, errors);
}

export type InboxItem = PostDraft | PostRequest;

export function isInboxItem(post: Post, errors?: string[]): post is InboxItem {
  return combinePostChecks<InboxItem>([isPostDraft, isPostRequest], post, errors);
}

export function isTrashOrInboxItem(post: Post, errors?: string[]): post is TrashItem | InboxItem {
  return combinePostChecks<TrashItem | InboxItem>([isTrashItem, isInboxItem], post, errors);
}

export type RevisitablePost = Post & { mark: 'F' };

export function isRevisitablePost(post: Post, errors?: string[]): post is RevisitablePost {
  return checkRules([needCertainMark('F')], post, errors);
}

export type EditorsChoice = Post & { mark: 'A1' };

export function isEditorsChoice(post: Post, errors?: string[]): post is EditorsChoice {
  return checkRules([needCertainMark('A1')], post, errors);
}

export interface NearOrdinaryPost extends Post {
  mark: 'C';
}

export function isNearOrdinaryPost(post: Post, errors?: string[]): post is NearOrdinaryPost {
  return checkRules([needCertainMark('C')], post, errors);
}

export function getPublishedPostChunkName(id: string) {
  const chunkName = id.split('-')[0];

  if (!chunkName) {
    throw new Error(`Cannot get year from post id: ${id}`);
  }
  return chunkName;
}

export function getPostDraftChunkName(id: string) {
  return id.split('.')[1]?.split('-')[0] ?? new Date().getFullYear().toString();
}

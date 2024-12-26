import {
  postAddon,
  postAuthor,
  postContent,
  postEngine,
  postLocation,
  postMark,
  postRequestText,
  postTags,
  postTitle,
  postTitleRu,
  postTrash,
  postType,
  postViolation,
} from '../entities/field.js';
import { GITHUB_ISSUE_CREATE_URL, GITHUB_ISSUE_DEFAULT_TITLE } from '../entities/github-issue.js';
import type { Post } from '../entities/post.js';
import { asArray } from '../utils/common-utils.js';

export const label = 'post-editing';

export function createIssueUrl(id?: string, post?: Post): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || GITHUB_ISSUE_DEFAULT_TITLE);
  url.searchParams.set(postContent.id, asArray(post?.content).join('\n'));
  url.searchParams.set(postTitle.id, post?.title || '');
  url.searchParams.set(postTitleRu.id, post?.titleRu || '');
  url.searchParams.set(postAuthor.id, asArray(post?.author).join(' '));
  url.searchParams.set(postType.id, post?.type || 'shot');
  url.searchParams.set(postEngine.id, post?.engine || '');
  url.searchParams.set(postAddon.id, post?.addon || '');
  url.searchParams.set(postTags.id, post?.tags?.join(' ') || '');
  url.searchParams.set(postLocation.id, asArray(post?.location).join('\n'));
  url.searchParams.set(postMark.id, post?.mark || '');
  url.searchParams.set(postViolation.id, post?.violation || '');
  url.searchParams.set(postTrash.id, asArray(post?.trash).join('\n'));
  url.searchParams.set(postRequestText.id, post?.request?.text || '');

  return url.toString();
}

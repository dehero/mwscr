import { GITHUB_ISSUE_CREATE_URL, GITHUB_ISSUE_DEFAULT_TITLE } from '../entities/github-issue.js';
import { postMark, postViolation } from '../entities/github-issue-field.js';
import type { Post } from '../entities/post.js';

export const label = 'post-review';

export function createIssueUrl(id?: string, post?: Pick<Post, 'mark' | 'violation'>): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || GITHUB_ISSUE_DEFAULT_TITLE);
  url.searchParams.set(postMark.id, post?.mark || '');
  url.searchParams.set(postViolation.id, post?.violation || '');

  return url.toString();
}

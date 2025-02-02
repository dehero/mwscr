import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';
import { postLocation } from '../entities/github-issue-field.js';
import type { PostLocation } from '../entities/post.js';
import { asArray } from '../utils/common-utils.js';

export const label = 'post-location';

export function createIssueUrl(id?: string, location?: PostLocation): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || '');
  url.searchParams.set(postLocation.id, asArray(location).join('\n'));

  return url.toString();
}

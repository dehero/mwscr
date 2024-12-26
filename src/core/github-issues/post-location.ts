import { postLocation } from '../entities/field.js';
import { GITHUB_ISSUE_CREATE_URL, GITHUB_ISSUE_DEFAULT_TITLE } from '../entities/github-issue.js';
import type { PostLocation } from '../entities/post.js';
import { asArray } from '../utils/common-utils.js';

export const label = 'post-location';

export function createIssueUrl(id?: string, location?: PostLocation): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || GITHUB_ISSUE_DEFAULT_TITLE);
  url.searchParams.set(postLocation.id, asArray(location).join('\n'));

  return url.toString();
}

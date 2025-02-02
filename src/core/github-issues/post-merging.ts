import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';
import { mergeWithIds } from '../entities/github-issue-field.js';

export const label = 'post-merging';

export function createIssueUrl(id?: string, withIds?: string[]): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || '');
  url.searchParams.set(mergeWithIds.id, withIds?.join('\n') || '');

  return url.toString();
}

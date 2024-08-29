import { mergeWithIds } from '../entities/field.js';
import { GITHUB_ISSUE_CREATE_URL, GITHUB_ISSUE_DEFAULT_TITLE } from '../entities/github-issue.js';

export const label = 'merging';

export function createIssueUrl(id?: string, withIds?: string[]): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || GITHUB_ISSUE_DEFAULT_TITLE);
  url.searchParams.set(mergeWithIds.id, withIds?.join('\n') || '');

  return url.toString();
}

import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';

export const label = 'post-request';

export function createIssueUrl(text?: string): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  if (text) {
    url.searchParams.set('title', text);
  }

  return url.toString();
}

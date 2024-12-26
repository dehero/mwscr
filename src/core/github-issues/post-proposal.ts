import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.js';

export const label = 'post-proposal';

export function createIssueUrl(): string {
  const url = new URL(GITHUB_ISSUE_CREATE_URL);
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);

  return url.toString();
}

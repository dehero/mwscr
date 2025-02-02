import type { Issues } from 'github-webhook-event-types';

export const GITHUB_ISSUE_CREATE_URL = 'https://github.com/dehero/mwscr/issues/new';

export type GithubIssue = Issues['issue'];

export interface GithubIssueInfo {
  label: string;
  createIssueUrl: () => string;
}

export interface GithubIssueResolver extends GithubIssueInfo {
  resolve: (issue: GithubIssue) => Promise<void>;
  createIssueTemplate: () => Promise<object>;
}

export interface GithubIssueField {
  id: string;
  label: string;
}

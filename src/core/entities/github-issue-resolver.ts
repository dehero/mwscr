import type { Issues } from 'github-webhook-event-types';

export type GithubIssue = Issues['issue'];

export interface GithubIssueResolver {
  label: string;
  resolve: (issue: GithubIssue) => Promise<void>;
  createIssueTemplate: () => Promise<object>;
  createIssueUrl: () => string;
}

export interface GithubIssueField {
  id: string;
  label: string;
}

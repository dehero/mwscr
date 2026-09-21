import type { GithubIssueDescriptor } from '../entities/github-issue.ts';
import { GITHUB_ISSUE_CREATE_URL } from '../entities/github-issue.ts';

export class PostProposalIssue implements GithubIssueDescriptor {
  readonly label = 'post-proposal';

  createIssueUrl(): string {
    const url = new URL(GITHUB_ISSUE_CREATE_URL);
    url.searchParams.set('labels', this.label);
    url.searchParams.set('template', `${this.label}.yml`);

    return url.toString();
  }
}

export const postProposalIssue = new PostProposalIssue();

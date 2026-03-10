import { GITHUB_ISSUE_CREATE_URL, GithubIssueDescriptor } from '../entities/github-issue.js';

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

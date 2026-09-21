import type { GithubIssueDescriptor } from '../entities/github-issue.ts';
import { dataPatchIssue } from './data-patch-issue.ts';
import { postProposalIssue } from './post-proposal-issue.ts';

export const githubIssues: GithubIssueDescriptor[] = [dataPatchIssue, postProposalIssue];

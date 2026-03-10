import type { GithubIssueDescriptor } from '../entities/github-issue.js';
import { dataPatchIssue } from './data-patch-issue.js';
import { postProposalIssue } from './post-proposal-issue.js';

export const githubIssues: GithubIssueDescriptor[] = [dataPatchIssue, postProposalIssue];

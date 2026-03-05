import type { GithubIssueInfo } from '../entities/github-issue.js';
import * as dataPatch from './data-patch.js';
import * as postProposal from './post-proposal.js';

export const githubIssues: GithubIssueInfo[] = [dataPatch, postProposal];

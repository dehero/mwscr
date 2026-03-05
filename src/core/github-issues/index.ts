import type { GithubIssueInfo } from '../entities/github-issue.js';
import * as dataPatch from './data-patch.js';
import * as postProposal from './post-proposal.js';
import * as postRequest from './post-request.js';

export const githubIssues: GithubIssueInfo[] = [dataPatch, postProposal, postRequest];

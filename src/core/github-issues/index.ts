import type { GithubIssueInfo } from '../entities/github-issue.js';
import * as editing from './editing.js';
import * as location from './location.js';
import * as merging from './merging.js';
import * as proposal from './proposal.js';
import * as request from './request.js';
import * as review from './review.js';

export const githubIssues: GithubIssueInfo[] = [proposal, request, editing, merging, location, review];

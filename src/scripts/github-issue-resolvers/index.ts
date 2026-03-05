import type { GithubIssueResolver } from '../../core/entities/github-issue.js';
import * as dataPatch from './data-patch.js';
import * as postProposal from './post-proposal.js';

export const githubIssueResolvers: GithubIssueResolver[] = [dataPatch, postProposal];

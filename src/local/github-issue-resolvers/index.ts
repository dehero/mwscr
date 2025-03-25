import type { GithubIssueResolver } from '../../core/entities/github-issue.js';
import * as dataPatch from './data-patch.js';
import * as postEditing from './post-editing.js';
import * as postLocation from './post-location.js';
import * as postProposal from './post-proposal.js';
import * as postRequest from './post-request.js';

export const githubIssueResolvers: GithubIssueResolver[] = [
  dataPatch,
  postProposal,
  postRequest,
  postEditing,
  postLocation,
];

import type { GithubIssueResolver } from '../../core/entities/github-issue.js';
import * as postEditing from './post-editing.js';
import * as postLocation from './post-location.js';
import * as postMerging from './post-merging.js';
import * as postProposal from './post-proposal.js';
import * as postRequest from './post-request.js';
import * as postReview from './post-review.js';

export const githubIssueResolvers: GithubIssueResolver[] = [
  postProposal,
  postRequest,
  postEditing,
  postMerging,
  postLocation,
  postReview,
];

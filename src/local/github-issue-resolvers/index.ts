import type { GithubIssueResolver } from '../../core/entities/github-issue-resolver.js';
import * as Editing from './editing.js';
import * as Location from './location.js';
import * as Merging from './merging.js';
import * as Proposal from './proposal.js';
import * as Request from './request.js';
import * as Review from './review.js';

export const resolvers: GithubIssueResolver[] = [Proposal, Request, Editing, Merging, Location, Review];

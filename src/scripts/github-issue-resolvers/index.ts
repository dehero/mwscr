import type { GithubIssueResolver } from '../../core/entities/github-issue.js';
import { dataPatchIssueResolver } from './data-patch-issue-resolver.js';
import { postProposalIssueResolver } from './post-proposal-issue-resolver.js';

export const githubIssueResolvers: GithubIssueResolver[] = [dataPatchIssueResolver, postProposalIssueResolver];

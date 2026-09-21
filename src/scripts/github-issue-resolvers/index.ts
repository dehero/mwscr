import type { GithubIssueResolver } from '../../core/entities/github-issue.ts';
import { dataPatchIssueResolver } from './data-patch-issue-resolver.ts';
import { postProposalIssueResolver } from './post-proposal-issue-resolver.ts';

export const githubIssueResolvers: GithubIssueResolver[] = [dataPatchIssueResolver, postProposalIssueResolver];

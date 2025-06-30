import type { GithubIssue } from '../../core/entities/github-issue.js';
import {
  postType,
  userName,
  userProfileIg,
  userProfileTg,
  userProfileVk,
} from '../../core/entities/github-issue-field.js';
import { PostType } from '../../core/entities/post.js';
import type { RequestProposal } from '../../core/entities/posts-manager.js';
import { createRequestProposalId } from '../../core/entities/posts-manager.js';
import { safeParseSchema } from '../../core/entities/schema.js';
import { label } from '../../core/github-issues/post-request.js';
import { drafts } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-request.js';

export async function resolve(issue: GithubIssue) {
  const [user] = await extractIssueUser(issue);
  const typeStr = extractIssueFieldValue(postType, issue.body);

  const request: RequestProposal = {
    request: {
      text: issue.title,
      user,
      date: new Date(issue.created_at),
    },
    type: safeParseSchema(PostType, typeStr) ?? 'shot',
  };

  const id = createRequestProposalId(request);
  await drafts.addItem(request, id);
  await drafts.save();

  console.info(`Created post request "${id}".`);
}

export async function createIssueTemplate() {
  const result = {
    name: 'Request Post',
    description: 'Describe in the title, which post you would like to request.',
    title: 'Cool to see, how cliffracer dies!',
    labels: [label],
    body: [postType, userName, userProfileIg, userProfileTg, userProfileVk],
  };

  return result;
}

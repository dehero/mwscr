import { postType, userName, userProfileIg, userProfileTg, userProfileVk } from '../../core/entities/field.js';
import type { GithubIssue } from '../../core/entities/github-issue.js';
import { PostType } from '../../core/entities/post.js';
import type { PostRequest } from '../../core/entities/post-variation.js';
import { label } from '../../core/github-issues/post-request.js';
import { createPostRequestId, inbox } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-request.js';

export async function resolve(issue: GithubIssue) {
  const [user] = await extractIssueUser(issue);
  const typeStr = extractIssueFieldValue(postType, issue.body);

  const request: PostRequest = {
    request: {
      text: issue.title,
      user,
      date: new Date(issue.created_at),
    },
    type: PostType.safeParse(typeStr).data ?? 'shot',
  };

  const id = createPostRequestId(request);
  await inbox.addItem(request, id);

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

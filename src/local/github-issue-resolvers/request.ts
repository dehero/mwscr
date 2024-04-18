import type { GithubIssue } from '../../core/entities/github-issue-resolver.js';
import { POST_TYPES } from '../../core/entities/post.js';
import type { PostRequest } from '../../core/entities/post-variation.js';
import { createPostRequestId, inbox } from '../data-managers/posts.js';
import { postType, userName, userProfileIg, userProfileTg, userProfileVk } from './utils/issue-fields.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export const label = 'request';

export async function resolve(issue: GithubIssue) {
  const [user] = await extractIssueUser(issue);
  const typeStr = extractIssueFieldValue(postType, issue.body);

  const request: PostRequest = {
    request: {
      text: issue.title,
      user,
      date: new Date(issue.created_at),
    },
    type: POST_TYPES.find((type) => type === typeStr) ?? 'shot',
  };

  const id = createPostRequestId(request);
  await inbox.addPost(id, request);

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

export function createIssueUrl(): string {
  const url = new URL('https://github.com/dehero/mwscr/issues/new');
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);

  return url.toString();
}

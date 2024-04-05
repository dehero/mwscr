import { getPost, inbox, published, trash } from '../data-managers/posts.js';
import type { GithubIssue } from '../entities/github-issue-resolver.js';
import type { PostViolation } from '../entities/post.js';
import { POST_MARKS, POST_VIOLATIONS } from '../entities/post.js';
import { postMark, postViolation } from './utils/issue-fields.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export const label = 'review';

const DEFAULT_TITLE = 'POST_ID';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await getPost(id, [inbox, trash, published]);

  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);

  post.mark = POST_MARKS.find((mark) => mark === markStr);
  post.violation = [...Object.entries(POST_VIOLATIONS)].find(
    ([, title]) => title === violationStr,
  )?.[0] as PostViolation;

  await manager.updatePost(id);

  console.info(`Post "${id}" updated".`);
}

export async function createIssueTemplate() {
  return {
    name: 'Review Post',
    description: 'Paste in the title the ID of post.',
    title: DEFAULT_TITLE,
    labels: [label],
    body: [postMark, postViolation],
  };
}

export function createIssueUrl(id?: string): string {
  const url = new URL('https://github.com/dehero/mwscr/issues/new');
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || DEFAULT_TITLE);

  return url.toString();
}

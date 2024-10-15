import { postMark, postViolation } from '../../core/entities/field.js';
import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import { searchListReaderItem } from '../../core/entities/list-manager.js';
import type { PostViolation } from '../../core/entities/post.js';
import { POST_MARKS, POST_VIOLATIONS } from '../../core/entities/post.js';
import { label } from '../../core/github-issues/review.js';
import { inbox, posts, trash } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser, issueDropdownToInput } from './utils/issue-utils.js';

export * from '../../core/github-issues/review.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await searchListReaderItem(id, [inbox, trash, posts]);

  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);

  post.mark = POST_MARKS.find((info) => info.id === markStr)?.id;
  post.violation = [...Object.keys(POST_VIOLATIONS)].find((id) => id === violationStr) as PostViolation | undefined;

  await manager.updateItem(id);

  console.info(`Post "${id}" updated".`);
}

export async function createIssueTemplate() {
  return {
    name: 'Review Post',
    description: 'Paste in the title the ID of post.',
    title: GITHUB_ISSUE_DEFAULT_TITLE,
    labels: [label],
    body: [issueDropdownToInput(postMark) as object, issueDropdownToInput(postViolation) as object],
  };
}

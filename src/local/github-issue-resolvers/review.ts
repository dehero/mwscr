import { searchDataReaderItem } from '../../core/entities/data-manager.js';
import { postMark, postViolation } from '../../core/entities/field.js';
import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import type { PostViolation } from '../../core/entities/post.js';
import { POST_MARKS, POST_VIOLATIONS } from '../../core/entities/post.js';
import { label } from '../../core/github-issues/review.js';
import { inbox, published, trash } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/review.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await searchDataReaderItem(id, [inbox, trash, published]);

  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);

  post.mark = POST_MARKS.find((mark) => mark === markStr);
  post.violation = [...Object.entries(POST_VIOLATIONS)].find(
    ([, title]) => title === violationStr,
  )?.[0] as PostViolation;

  await manager.updateItem(id);

  console.info(`Post "${id}" updated".`);
}

export async function createIssueTemplate() {
  return {
    name: 'Review Post',
    description: 'Paste in the title the ID of post.',
    title: GITHUB_ISSUE_DEFAULT_TITLE,
    labels: [label],
    body: [postMark, postViolation],
  };
}

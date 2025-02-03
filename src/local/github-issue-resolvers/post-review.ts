import { type GithubIssue } from '../../core/entities/github-issue.js';
import { postMark, postViolation } from '../../core/entities/github-issue-field.js';
import { searchListReaderItem } from '../../core/entities/list-manager.js';
import { PostMark, PostViolation } from '../../core/entities/post.js';
import { safeParseSchema } from '../../core/entities/schema.js';
import { label } from '../../core/github-issues/post-review.js';
import { inbox, posts, trash } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser, issueDropdownToInput } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-review.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await searchListReaderItem(id, [inbox, trash, posts]);

  const markStr = extractIssueFieldValue(postMark, issue.body);
  const violationStr = extractIssueFieldValue(postViolation, issue.body);

  post.mark = safeParseSchema(PostMark, markStr);
  post.violation = safeParseSchema(PostViolation, violationStr);

  await manager.save();

  console.info(`Post "${id}" updated".`);
}

export async function createIssueTemplate() {
  return {
    name: 'Review Post',
    description: 'Paste in the title the ID of post.',
    labels: [label],
    body: [issueDropdownToInput(postMark) as object, issueDropdownToInput(postViolation) as object],
  };
}

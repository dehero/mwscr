import { type GithubIssue } from '../../core/entities/github-issue.js';
import { mergeWithIds } from '../../core/entities/github-issue-field.js';
import { searchListReaderItem } from '../../core/entities/list-manager.js';
import { label } from '../../core/github-issues/post-merging.js';
import { listItems } from '../../core/utils/common-utils.js';
import { inbox, trash } from '../data-managers/posts.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-merging.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);
  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [, manager] = await searchListReaderItem(issue.title, [inbox, trash]);

  const withIds = extractIssueTextareaValue(mergeWithIds, issue.body)?.split(/\r?\n/).filter(Boolean);

  if (withIds) {
    await manager.mergeItems(id, ...withIds);
    await manager.save();
    console.info(`Item "${id}" merged with ${listItems(withIds, true, 'and')}.`);
  } else {
    console.info(`No items to merge with "${id}".`);
  }
}

export async function createIssueTemplate(id?: string) {
  const result = {
    name: 'Merge Posts',
    description: 'Paste in the title the ID of post from inbox or trash.',
    title: id,
    labels: [label],
    body: [mergeWithIds],
  };

  return result;
}

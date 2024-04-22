import { mergeWithIds } from '../../core/entities/field.js';
import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import { mergePostWith } from '../../core/entities/post.js';
import { getPost } from '../../core/entities/posts-manager.js';
import { label } from '../../core/github-issues/merging.js';
import { inbox, trash } from '../data-managers/posts.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/merging.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);
  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await getPost(issue.title, [inbox, trash]);

  const withIds = extractIssueTextareaValue(mergeWithIds, issue.body)?.split(/\r?\n/).filter(Boolean);

  if (withIds) {
    for (const withId of withIds) {
      const [withPost, withManager] = await getPost(withId, [inbox, trash]);
      if (manager !== withManager) {
        throw new Error(`Cannot merge ${manager.title} and ${withManager.title} posts.`);
      } else {
        mergePostWith(post, withPost);
        await withManager.removePost(withId);
        console.info(`Post "${id}" merged with "${withId}".`);
      }
    }
    await manager.updatePost(id);
  } else {
    console.info(`No posts to merge with "${id}".`);
  }
}

export async function createIssueTemplate(id?: string) {
  const result = {
    name: 'Merge Posts',
    description: 'Paste in the title the ID of post from inbox or trash.',
    title: id || GITHUB_ISSUE_DEFAULT_TITLE,
    labels: [label],
    body: [mergeWithIds],
  };

  return result;
}

import { getPost, inbox, trash } from '../data-managers/posts.js';
import type { GithubIssue } from '../entities/github-issue-resolver.js';
import { mergePostWith } from '../entities/post.js';
import { mergeWithIds } from './utils/issue-fields.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export const label = 'merging';

const DEFAULT_TITLE = 'POST_ID';

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
    title: id || DEFAULT_TITLE,
    labels: [label],
    body: [mergeWithIds],
  };

  return result;
}

export function createIssueUrl(id?: string): string {
  const url = new URL('https://github.com/dehero/mwscr/issues/new');
  url.searchParams.set('labels', label);
  url.searchParams.set('template', `${label}.yml`);
  url.searchParams.set('title', id || DEFAULT_TITLE);

  return url.toString();
}

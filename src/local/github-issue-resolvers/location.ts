import type { GithubIssue } from '../../core/entities/github-issue-resolver.js';
import { findLocation, getLocations } from '../data-managers/locations.js';
import { getPost, inbox, published, trash } from '../data-managers/posts.js';
import { postLocation } from './utils/issue-fields.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export const label = 'location';

const DEFAULT_TITLE = 'POST_ID';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await getPost(id, [published, inbox, trash]);
  const locationStr = extractIssueFieldValue(postLocation, issue.body);

  if (!locationStr) {
    console.error(`Location was not selected.`);
  } else {
    const location = await findLocation(locationStr);
    if (location) {
      post.location = location;
      await manager.updatePost(id);
      console.info(`Set location "${locationStr}" for ${manager.title} post "${id}".`);
    } else {
      console.error(`Location "${locationStr}" not found.`);
    }
  }
}

export async function createIssueTemplate() {
  const locations = await getLocations();

  const result = {
    name: 'Locate Post',
    description: 'Select where the shot was done.',
    title: DEFAULT_TITLE,
    labels: [label],
    body: [
      {
        ...postLocation,
        attributes: {
          ...postLocation.attributes,
          options: locations,
        },
      },
    ],
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

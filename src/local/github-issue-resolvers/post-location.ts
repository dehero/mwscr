import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import { postLocation } from '../../core/entities/github-issue-field.js';
import { searchListReaderItem } from '../../core/entities/list-manager.js';
import { mergePostLocations } from '../../core/entities/post.js';
import { label } from '../../core/github-issues/post-location.js';
import { listItems } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { inbox, posts, trash } from '../data-managers/posts.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-location.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await searchListReaderItem(id, [posts, inbox, trash]);
  const rawLocation = extractIssueTextareaValue(postLocation, issue.body)?.split(/\r?\n/).filter(Boolean);

  if (!rawLocation) {
    console.error(`Locations were not selected.`);
  } else {
    const entries = await locations.findEntries(rawLocation.map((title) => ({ title })));
    const locationIds: string[] = [];

    for (const [i, element] of rawLocation.entries()) {
      const entry = entries[i];
      if (!entry) {
        console.error(`Location "${element}" not found.`);
      } else {
        locationIds.push(entry[0]);
      }
    }

    post.location = mergePostLocations(locationIds);
    await manager.updateItem(id);

    if (post.location) {
      console.info(`Set locations ${listItems(locationIds, true)} for ${manager.name} item "${id}".`);
    } else {
      console.info(`Set no locations for ${manager.name} item "${id}".`);
    }
  }
}

export async function createIssueTemplate() {
  return {
    name: 'Locate Post',
    description: 'Select where the shot was done.',
    title: GITHUB_ISSUE_DEFAULT_TITLE,
    labels: [label],
    body: [postLocation],
  };
}

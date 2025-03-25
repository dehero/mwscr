import { type GithubIssue } from '../../core/entities/github-issue.js';
import { postLocation } from '../../core/entities/github-issue-field.js';
import { locationMatchesString } from '../../core/entities/location.js';
import { mergePostLocations } from '../../core/entities/post.js';
import { parsePostPath } from '../../core/entities/posts-manager.js';
import { label } from '../../core/github-issues/post-location.js';
import { listItems } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { dataManager } from '../data-managers/manager.js';
import { extractIssueTextareaValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-location.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const { managerName, id } = parsePostPath(issue.title);
  if (!managerName || !id) {
    throw new Error(`Cannot get posts manager name and post ID from issue title.`);
  }

  const manager = dataManager.findPostsManager(managerName);
  if (!manager) {
    throw new Error(`Cannot find manager name "${managerName}".`);
  }

  const post = await manager.getItem(id);
  if (!post) {
    throw new Error(`Cannot find items "${id}" through ${manager.name} items.`);
  }

  const rawLocation = extractIssueTextareaValue(postLocation, issue.body)?.split(/\r?\n/).filter(Boolean);

  if (!rawLocation) {
    console.error(`Locations were not selected.`);
  } else {
    const entries = await Promise.all(
      rawLocation.map((str) => locations.findEntry((location) => locationMatchesString(location, str))),
    );
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

    await manager.save();

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
    labels: [label],
    body: [postLocation],
  };
}

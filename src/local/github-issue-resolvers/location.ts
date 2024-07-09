import { searchDataReaderItem } from '../../core/entities/data-manager.js';
import { postLocation } from '../../core/entities/field.js';
import { GITHUB_ISSUE_DEFAULT_TITLE, type GithubIssue } from '../../core/entities/github-issue.js';
import { label } from '../../core/github-issues/location.js';
import { arrayFromAsync } from '../../core/utils/common-utils.js';
import { locations } from '../data-managers/locations.js';
import { inbox, published, trash } from '../data-managers/posts.js';
import { extractIssueFieldValue, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/location.js';

export async function resolve(issue: GithubIssue) {
  const [userId, user] = await extractIssueUser(issue);

  if (!user.admin) {
    throw new Error(`Post ${label} is not allowed for non-administrator user "${userId}".`);
  }

  const id = issue.title;
  const [post, manager] = await searchDataReaderItem(id, [published, inbox, trash]);
  const locationStr = extractIssueFieldValue(postLocation, issue.body);

  if (!locationStr) {
    console.error(`Location was not selected.`);
  } else {
    const [location] = (await locations.findEntry({ title: locationStr })) ?? [];
    if (location) {
      post.location = location;
      await manager.updateItem(id);
      console.info(`Set location "${locationStr}" for ${manager.name} post "${id}".`);
    } else {
      console.error(`Location "${locationStr}" not found.`);
    }
  }
}

export async function createIssueTemplate() {
  const options = (await arrayFromAsync(locations.readAllEntries(true))).map(([, { title }]) => title);

  const result = {
    name: 'Locate Post',
    description: 'Select where the shot was done.',
    title: GITHUB_ISSUE_DEFAULT_TITLE,
    labels: [label],
    body: [
      {
        ...postLocation,
        attributes: {
          ...postLocation.attributes,
          options,
        },
      },
    ],
  };

  return result;
}

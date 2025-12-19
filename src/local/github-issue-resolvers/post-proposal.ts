import type { GithubIssue } from '../../core/entities/github-issue.js';
import { userName, userProfileIg, userProfileTg, userProfileVk } from '../../core/entities/github-issue-field.js';
import { label } from '../../core/github-issues/post-proposal.js';
import { drafts } from '../data-managers/posts.js';
import { importResourceToStore } from '../data-managers/store-resources.js';
import { extractIssueLinks, extractIssueUrls, extractIssueUser } from './utils/issue-utils.js';

export * from '../../core/github-issues/post-proposal.js';

export async function resolve(issue: GithubIssue) {
  const issueTitle = issue.title;
  const issueDate = new Date(issue.created_at);

  const [author] = await extractIssueUser(issue);
  const items: Map<string, string | undefined> = new Map();

  const links = extractIssueLinks(issue.body);
  links.forEach(([url, title], index) =>
    items.set(url ?? index.toString(), title || items.get(url ?? index.toString())),
  );

  const urls = extractIssueUrls(issue.body);
  urls.forEach(([url]) => items.set(url, undefined));

  for (const [url, text] of items) {
    const draftEntries = await importResourceToStore(url, { title: text || issueTitle, author }, issueDate);

    for (const [id, post] of draftEntries) {
      try {
        await drafts.addItem(post, id);
        await drafts.save();

        console.info(`Created draft "${id}" from "${url}".`);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error creating draft "${id}" from "${url}": ${error.message}`);
        }
      }
    }
  }
}

export async function createIssueTemplate() {
  const result = {
    name: 'Propose Post',
    description: 'Write post or post group title, which you would like to propose.',
    labels: [label],
    body: [
      {
        type: 'textarea',
        id: 'text',
        attributes: {
          label: 'Images',
          description: 'What images would you like to propose?',
          placeholder:
            'Paste public links or attach images or ZIP archives with images. Only .png and .zip files are allowed.',
        },
        validations: {
          required: true,
        },
      },
      {
        type: 'markdown',
        attributes: {
          value: '## Author',
        },
      },
      userName,
      userProfileIg,
      userProfileTg,
      userProfileVk,
    ],
  };

  return result;
}

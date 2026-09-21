import type { GithubIssue, GithubIssueResolver } from '../../core/entities/github-issue.ts';
import { userName, userProfileIg, userProfileTg, userProfileVk } from '../../core/entities/github-issue-field.ts';
import { PostProposalIssue } from '../../core/github-issues/post-proposal-issue.ts';
import { drafts } from '../data-managers/posts.ts';
import { importResourceToStore } from '../data-managers/store-resources.ts';
import { extractIssueLinks, extractIssueUrls, extractIssueUser } from './utils/issue-utils.ts';

export class PostProposalIssueResolver extends PostProposalIssue implements GithubIssueResolver {
  async resolve(issue: GithubIssue) {
    const issueTitle = issue.title;
    const created = new Date(issue.created_at);

    const [author] = await extractIssueUser(issue);
    const items: Map<string, string | undefined> = new Map();

    const links = extractIssueLinks(issue.body);
    links.forEach(([url, title], index) =>
      items.set(url ?? index.toString(), title || items.get(url ?? index.toString())),
    );

    const urls = extractIssueUrls(issue.body);
    urls.forEach(([url]) => items.set(url, undefined));

    for (const [url, text] of items) {
      const draftEntries = await importResourceToStore(url, { title: text || issueTitle, author, created });

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

  async createIssueTemplate() {
    const result = {
      name: 'Propose Post',
      description: 'Write post or post group title, which you would like to propose.',
      labels: [this.label],
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
}

export const postProposalIssueResolver = new PostProposalIssueResolver();

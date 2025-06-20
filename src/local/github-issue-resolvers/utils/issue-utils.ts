import type { GithubIssue } from '../../../core/entities/github-issue.js';
import { userName, userProfileIg, userProfileTg, userProfileVk } from '../../../core/entities/github-issue-field.js';
import type { ListReaderEntry } from '../../../core/entities/list-manager.js';
import { mergeUserWith, type User } from '../../../core/entities/user.js';
import { getRevisionHash } from '../../../core/utils/common-utils.js';
import { saveUserAvatar } from '../../data-managers/store-resources.js';
import { users } from '../../data-managers/users.js';

const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^\)]+)\)/g;
const MARKDOWN_URL_REGEX =
  /https?:\/\/(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;

interface IssueFieldWithLabel {
  attributes: {
    label: string;
  };
}

interface IssueFieldDropdown {
  type: 'dropdown';
  id: string;
  attributes: {
    label: string;
    description?: string;
    options: ReadonlyArray<string>;
  };
}

interface IssueFieldCheckboxes {
  type: 'checkboxes';
  id: string;
  attributes: {
    label: string;
    description?: string;
    options: ReadonlyArray<{ label: string; required?: boolean }>;
  };
}

interface IssueFieldInput {
  type: 'input';
  id: string;
  attributes: {
    label: string;
    description?: string;
    placeholder?: string;
  };
}

export function extractIssueFieldValue(field: IssueFieldWithLabel, text: string) {
  const regex = new RegExp(`### ${field.attributes.label}\\r?\\n\\s+(.+)\\r?\\n`, 'gm');
  const [, value] = regex.exec(text + '\n') ?? [];

  return value?.replace('_No response_', '').trim() || undefined;
}

export function extractIssueTextareaValue(field: IssueFieldWithLabel, text: string) {
  const regex = new RegExp(`### ${field.attributes.label}\\r?\\n\\s*\`\`\`.*\\r?\\n\\s*([^\`]+)`, 'gm');
  const [, value] = regex.exec(text + '\n') ?? [];

  return value?.replace('_No response_', '').trim() || undefined;
}

export async function extractIssueUser(issue: GithubIssue): Promise<ListReaderEntry<User>> {
  const avatar = await saveUserAvatar(issue.user.avatar_url, `gh-${getRevisionHash(issue.user.avatar_url)}.jpg`);
  const entry = await users.mergeOrAddItem({
    profiles: [
      { service: 'gh', id: issue.user.id.toString(), username: issue.user.login, avatar, updated: new Date() },
    ],
  });

  const name = extractIssueFieldValue(userName, issue.body);
  const igUsername = extractIssueFieldValue(userProfileIg, issue.body);
  const tgUsername = extractIssueFieldValue(userProfileTg, issue.body);
  const vkUsername = extractIssueFieldValue(userProfileVk, issue.body);

  const user: User = {
    name,
    profiles: [
      igUsername ? { service: 'ig', username: igUsername } : undefined,
      tgUsername ? { service: 'tg', username: tgUsername } : undefined,
      vkUsername ? { service: 'vk', username: vkUsername } : undefined,
    ].filter((profile) => typeof profile !== 'undefined'),
  };

  mergeUserWith(entry[1], user);

  await users.save();

  return entry;
}

export function extractIssueLinks(text: string) {
  const links = text.matchAll(MARKDOWN_LINK_REGEX);

  return [...links].map(([_, title, url]) => [url, title]);
}

export function extractIssueUrls(text: string) {
  return [...text.matchAll(MARKDOWN_URL_REGEX)];
}

export function issueDropdownToInput(field: IssueFieldDropdown): IssueFieldInput {
  return {
    type: 'input',
    id: field.id,
    attributes: {
      label: field.attributes.label,
      description: field.attributes.description,
      placeholder: field.attributes.options.join(' '),
    },
  };
}

export function issueDropdownToCheckboxes(field: IssueFieldDropdown): IssueFieldCheckboxes {
  return {
    type: 'checkboxes',
    id: field.id,
    attributes: {
      label: field.attributes.label,
      description: field.attributes.description,
      options: field.attributes.options.map((label) => ({ label })),
    },
  };
}

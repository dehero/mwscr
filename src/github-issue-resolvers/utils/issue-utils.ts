import { findUser, mergeUser } from '../../data-managers/users.js';
import type { GithubIssue } from '../../entities/github-issue-resolver.js';
import type { User } from '../../entities/user.js';
import { userName, userProfileIg, userProfileTg, userProfileVk } from './issue-fields.js';

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

export async function extractIssueUser(issue: GithubIssue): Promise<[string, User]> {
  const [issueUserId, issueUser] = await mergeUser({ profiles: { gh: issue.user.login } });

  const name = extractIssueFieldValue(userName, issue.body);
  if (name) {
    const [userId] = (await findUser({ name })) ?? [];
    // Administrator can override issue user, his name and profiles
    // New user can set his own name and profiles
    if (!userId || userId === issueUserId || issueUser.admin) {
      const ig = extractIssueFieldValue(userProfileIg, issue.body);
      const tg = extractIssueFieldValue(userProfileTg, issue.body);
      const vk = extractIssueFieldValue(userProfileVk, issue.body);

      return mergeUser({ name, profiles: { ig, tg, vk } });
    }
  }

  return [issueUserId, issueUser];
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

import { writeFile } from 'fs/promises';
import esc from 'escape-html';
import type { Doc } from '../../core/entities/doc.js';
import type { Link } from '../../core/entities/link.js';
import type { PostsManager } from '../../core/entities/posts-manager.js';
import type { PostsUsage } from '../../core/entities/posts-usage.js';
import { isPostsUsageEmpty, postsUsageToString } from '../../core/entities/posts-usage.js';
import type { UserEntry } from '../../core/entities/user.js';
import { createUserLinks } from '../../core/entities/user.js';
import type { UserInfo } from '../../core/entities/user-info.js';
import { compareUserInfosByContribution, createUserInfo } from '../../core/entities/user-info.js';
import type { UsersManager } from '../../core/entities/users-manager.js';
import { services } from '../../core/services/index.js';
import { partition } from '../../core/utils/common-utils.js';
import { renderNavs } from './utils/doc-utils.js';

interface RenderUserInfo extends UserInfo {
  links: Link[];
}

export interface RenderUsersOptions {
  users: UsersManager;
  postsManagers: PostsManager[];
  doc: Doc;
  navs: Array<Doc[]>;
}

export async function renderUsers(options: RenderUsersOptions) {
  let userInfos = (
    await Promise.all((await options.users.getAllEntries(true)).map(async (item) => mapUserEntry(item, options)))
  ).sort(compareUserInfosByContribution('desc'));
  const { navs, doc } = options;
  const { filename, title } = doc;
  const lines: string[] = [];

  lines.push(...renderNavs(navs, filename));

  lines.push(`# ${esc(title)}`);
  lines.push('');

  const [authors, nonAuthors] = partition(userInfos, (user) => user.roles.includes('author'));
  userInfos = nonAuthors;
  if (authors.length > 0) {
    lines.push('## Authors');
    lines.push('');
    lines.push(...authors.flatMap(renderUserInfo));
  }

  const [requesters, nonRequesters] = partition(userInfos, (user) => user.roles.includes('requester'));
  userInfos = nonRequesters;
  if (requesters.length > 0) {
    lines.push('## Requesters');
    lines.push('');
    lines.push(...requesters.flatMap(renderUserInfo));
  }

  if (userInfos.length > 0) {
    lines.push('## Other');
    lines.push('');
    lines.push(...userInfos.flatMap(renderUserInfo));
  }

  const data = lines.join('\n');

  return writeFile(filename, data);
}

async function mapUserEntry(userEntry: UserEntry, options: RenderUsersOptions): Promise<RenderUserInfo> {
  const { postsManagers } = options;

  return {
    ...(await createUserInfo(userEntry, postsManagers)),
    links: createUserLinks(userEntry, services),
  };
}

function renderPostsUsage(title: string, contribution: PostsUsage): string[] {
  if (isPostsUsageEmpty(contribution)) {
    return [];
  }

  return [`${esc(title)}: ${postsUsageToString(contribution)}  `];
}

function renderUserInfo(info: RenderUserInfo) {
  const lines: string[] = [];

  lines.push(`### ${esc(info.title)}`);
  lines.push('');

  if (info.links.length > 0) {
    lines.push(info.links.map((link) => `[${esc(link.text)}](${esc(link.url)})`).join(', '));
    lines.push('');
  }

  lines.push(`Roles: ${info.roles.map((role) => `\`${esc(role)}\``).join(' ')}  `);
  if (info.authored) {
    lines.push(...renderPostsUsage('Authored', info.authored));
  }

  if (info.requested) {
    lines.push(...renderPostsUsage('Requested', info.requested));
  }

  if (info.likes) {
    lines.push(`Likes: ${info.likes}  `);
  }

  lines.push('');

  if (info.id) {
    lines.push('```');
    lines.push(esc(info.id));
    lines.push('```');
    lines.push('');
  }

  return lines;
}

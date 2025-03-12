import { writeFile } from 'fs/promises';
import esc from 'escape-html';
import type { DataManager } from '../../core/entities/data-manager.js';
import type { Doc } from '../../core/entities/doc.js';
import type { PostsUsage } from '../../core/entities/posts-usage.js';
import { isPostsUsageEmpty, postsUsageToString } from '../../core/entities/posts-usage.js';
import type { UserInfo } from '../../core/entities/user-info.js';
import { compareUserInfosByContribution } from '../../core/entities/user-info.js';
import { partition } from '../../core/utils/common-utils.js';
import { renderNavs } from './utils/doc-utils.js';

export interface RenderUsersOptions {
  dataManager: DataManager;
  doc: Doc;
  navs: Array<Doc[]>;
}

export async function renderUsers(options: RenderUsersOptions) {
  let userInfos = (await options.dataManager.getAllUserInfos()).sort(compareUserInfosByContribution('desc'));

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

function renderPostsUsage(title: string, contribution: PostsUsage): string[] {
  if (isPostsUsageEmpty(contribution)) {
    return [];
  }

  return [`${esc(title)}: ${postsUsageToString(contribution)}  `];
}

function renderUserInfo(info: UserInfo) {
  const lines: string[] = [];

  lines.push(`### ${esc(info.title)}`);
  lines.push('');

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

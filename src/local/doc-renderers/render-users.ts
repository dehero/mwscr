import { writeFile } from 'fs/promises';
import esc from 'escape-html';
import type { Doc } from '../../core/entities/doc.js';
import type { PostEntries, PostType } from '../../core/entities/post.js';
import { getPostTotalLikes, POST_TYPES } from '../../core/entities/post.js';
import type { ReadonlyUsers, User, UserRoleId } from '../../core/entities/user.js';
import { services } from '../../core/services/index.js';
import { asArray, partition } from '../../core/utils/common-utils.js';
import { renderNavs } from './utils/doc-utils.js';

interface UserContribution {
  title: string;
  rejected: number;
  pending: number;
  published: number;
}

interface RenderedLink {
  text: string;
  url: string;
}

interface RenderedUser {
  id: string;
  name?: string;
  authored: UserContribution;
  requested: UserContribution;
  likes: number;
  roles: UserRoleId[];
  postTypes: PostType[];
  links: RenderedLink[];
}

function compareContributions(a: UserContribution, b: UserContribution) {
  return a.published - b.published || a.pending - b.pending || a.rejected - b.rejected;
}

function compareUserInfos(a: RenderedUser, b: RenderedUser) {
  return (
    compareContributions(b.authored, a.authored) ||
    compareContributions(b.requested, a.requested) ||
    (a.name || a.id).localeCompare(b.name || b.id, 'en')
  );
}

export interface RenderUsersOptions {
  users: ReadonlyUsers;
  published: PostEntries;
  inbox: PostEntries;
  trash: PostEntries;
  doc: Doc;
  navs: Array<Doc[]>;
}

export async function renderUsers(options: RenderUsersOptions) {
  let users = [...options.users].map((item) => grabUserInfo(item, options)).sort(compareUserInfos);
  const { navs, doc } = options;
  const { filename, title } = doc;
  const lines: string[] = [];

  lines.push(...renderNavs(navs, filename));

  lines.push(`# ${esc(title)}`);
  lines.push('');

  const [authors, nonAuthors] = partition(users, (user) => user.roles.includes('author'));
  users = nonAuthors;
  if (authors.length > 0) {
    lines.push('## Authors');
    lines.push('');
    lines.push(...authors.flatMap(renderUserInfo));
  }

  const [requesters, nonRequesters] = partition(users, (user) => user.roles.includes('requester'));
  users = nonRequesters;
  if (requesters.length > 0) {
    lines.push('## Requesters');
    lines.push('');
    lines.push(...requesters.flatMap(renderUserInfo));
  }

  if (users.length > 0) {
    lines.push('## Other');
    lines.push('');
    lines.push(...users.flatMap(renderUserInfo));
  }

  const data = lines.join('\n');

  return writeFile(filename, data);
}

function grabUserInfo([id, user]: [string, User], options: RenderUsersOptions): RenderedUser {
  const { published, inbox, trash } = options;

  const authored: UserContribution = {
    title: 'Authored',
    published: published.reduce((sum, [, post]) => sum + Number(asArray(post.author).includes(id)), 0),
    pending: inbox.reduce((sum, [, post]) => sum + Number(asArray(post.author).includes(id)), 0),
    rejected: trash.reduce((sum, [, post]) => sum + Number(asArray(post.author).includes(id)), 0),
  };
  const drawn: UserContribution = {
    title: 'Drawn',
    published: published.reduce(
      (sum, [, post]) => sum + Number(asArray(post.author)[0] === id && post.type === 'drawing'),
      0,
    ),
    pending: inbox.reduce(
      (sum, [, post]) => sum + Number(asArray(post.author)[0] === id && post.type === 'drawing'),
      0,
    ),
    rejected: trash.reduce(
      (sum, [, post]) => sum + Number(asArray(post.author)[0] === id && post.type === 'drawing'),
      0,
    ),
  };
  const requested: UserContribution = {
    title: 'Requested',
    published: published.reduce((sum, [, post]) => sum + Number(post.request?.user === id), 0),
    pending: inbox.reduce((sum, [, post]) => sum + Number(post.request?.user === id), 0),
    rejected: trash.reduce((sum, [, post]) => sum + Number(post.request?.user === id), 0),
  };
  const likes = published
    .filter(([, post]) => asArray(post.author).includes(id))
    .reduce((sum, [, post]) => sum + getPostTotalLikes(post), 0);
  const postTypes: Set<PostType> = new Set();

  [...published, ...inbox].forEach(([, post]) => {
    if (asArray(post.author).includes(id)) {
      postTypes.add(post.type);
    }
  });

  const roles: UserRoleId[] = [];

  if (user.admin) {
    roles.push('admin');
  }

  if (authored.published || authored.pending) {
    roles.push('author');
  }

  if (drawn.published || drawn.pending) {
    roles.push('drawer');
  }

  if (requested.published || requested.pending) {
    roles.push('requester');
  }

  if (!authored.published && !requested.published) {
    roles.push('beginner');
  }

  const links: RenderedLink[] = [];

  for (const service of services) {
    const userId = user.profiles?.[service.id];
    if (userId) {
      const url = service.getUserProfileUrl(userId);
      if (url) {
        links.push({ text: service.name, url });
      }
    }
  }

  return {
    id,
    name: user.name,
    authored,
    requested,
    likes,
    roles,
    postTypes: [...postTypes].sort((a, b) => POST_TYPES.indexOf(a) - POST_TYPES.indexOf(b)),
    links,
  };
}

function renderUserContribution({ title, published, pending, rejected }: UserContribution): string {
  return `${esc(title)}: ${[
    published && `${published} published`,
    pending && `${pending} pending`,
    rejected && `${rejected} rejected`,
  ]
    .filter((a) => a)
    .join(', ')}  `;
}

function renderUserInfo(info: RenderedUser) {
  const lines: string[] = [];

  lines.push(`### ${esc(info.name || info.id)}`);
  lines.push('');

  if (info.links.length > 0) {
    lines.push(info.links.map((link) => `[${esc(link.text)}](${esc(link.url)})`).join(', '));
    lines.push('');
  }

  lines.push(`Roles: ${info.roles.map((role) => `\`${esc(role)}\``).join(' ')}  `);
  lines.push(
    ...[info.authored, info.requested]
      .filter((contribution) => contribution.published || contribution.pending || contribution.rejected)
      .map(renderUserContribution),
  );
  if (info.postTypes.length > 0) {
    lines.push(`Types: ${info.postTypes.map((type) => `\`${esc(type)}\``).join(' ')}  `);
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

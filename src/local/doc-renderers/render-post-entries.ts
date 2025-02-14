import { writeFile } from 'fs/promises';
import esc from 'escape-html';
import type { Doc } from '../../core/entities/doc.js';
import type {
  Post,
  PostComment,
  PostContent,
  PostEntriesComparator,
  PostEntry,
  PostFilter,
  PostSource,
} from '../../core/entities/post.js';
import {
  getAllPostCommentsSorted,
  getPostEntriesFromSource,
  getPostEntryStats,
  postViolationDescriptors,
} from '../../core/entities/post.js';
import type { PostAction } from '../../core/entities/post-action.js';
import { isTrashItem } from '../../core/entities/posts-manager.js';
import { getPublicationEngagement } from '../../core/entities/publication.js';
import { parseResourceUrl } from '../../core/entities/resource.js';
import type { PostingService } from '../../core/entities/service.js';
import { USER_UNKNOWN } from '../../core/entities/user.js';
import type { UsersManager } from '../../core/entities/users-manager.js';
import { asArray, capitalizeFirstLetter } from '../../core/utils/common-utils.js';
import { dateToString } from '../../core/utils/date-utils.js';
import { getResourcePreviewPath } from '../data-managers/resources.js';
import { createIssueUrl as createEditUrl } from '../github-issue-resolvers/post-editing.js';
import { createIssueUrl as createLocateUrl } from '../github-issue-resolvers/post-location.js';
import { createIssueUrl as createMergeUrl } from '../github-issue-resolvers/post-merging.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';
import { renderNavs } from './utils/doc-utils.js';
import { renderMarkdownTable } from './utils/markdown-utils.js';
import { relativeUrl } from './utils/url-utils.js';

export interface PostEntriesDoc extends Doc {
  source: PostSource<Post>;
  compareFn?: PostEntriesComparator;
  filterFn?: PostFilter<Post, Post>;
  size?: number;
}

interface RenderedPublication {
  service?: string;
  published?: string;
  followers?: number;
  likes?: number;
  views?: number;
  engagement?: number;
  link?: string;
}

export interface RenderPostsOptions {
  doc: PostEntriesDoc;
  postActions?: PostAction[];
  postCheck?: (post: Post, errors?: string[]) => boolean;
  navs: Array<Doc[]>;
  users: UsersManager;
}

export async function renderPostEntriesDoc(options: RenderPostsOptions) {
  const { doc, navs } = options;
  const { source, compareFn, filterFn, size, filename, title } = doc;
  const postEntries = await getPostEntriesFromSource(source, compareFn, filterFn, size);
  const lines: string[] = [];

  lines.push(...renderNavs(navs, filename));

  lines.push(`# ${esc(title)}`);
  lines.push('');

  if (postEntries.length === 0) {
    lines.push('_No posts_');
    lines.push('');
  } else {
    lines.push(`\`${postEntries.length} items\``);
    lines.push('');

    for (const postEntry of postEntries) {
      lines.push(...(await renderPostEntry(postEntry, options)));
    }

    const lastNavs = navs[navs.length - 1];

    if (navs.length > 1 && lastNavs) {
      lines.push('---');
      lines.push('');
      lines.push(...renderNavs([lastNavs], filename));
    }
  }

  const data = lines.join('\n');

  return writeFile(filename, data);
}

function renderPostEntryReactions(postEntry: PostEntry) {
  const lines: string[] = [];
  const [, post] = postEntry;

  lines.push(`### Reactions`);
  lines.push('');

  const serviceInfos: RenderedPublication[] = [
    ...postingServiceManagers
      .flatMap((service) => mapPublication(service, post))
      .sort((a, b) => a.published?.localeCompare(b.published ?? '') ?? 0),
    getPostEntryStats(postEntry),
  ];

  if (serviceInfos.length > 0) {
    lines.push(
      ...renderMarkdownTable(
        ['', 'published', 'views', 'likes', 'followers', 'engagement'],
        serviceInfos,
        (row, column) =>
          row
            ? column === 'engagement'
              ? Number(row.engagement?.toFixed(2))
              : column
                ? row[column as keyof RenderedPublication]
                : row.link && row.service
                  ? `[\`${esc(row.service)}\`](${esc(row.link)})`
                  : row.service
                    ? `\`${esc(row.service)}\``
                    : ''
            : column,
      ),
    );
    lines.push('');
  }

  const comments = getAllPostCommentsSorted(post.posts);

  if (comments.length > 0) {
    lines.push('#### Comments');
    lines.push('');
    lines.push(...comments.flatMap((comment) => renderComment(comment)));
    lines.push('');
  }

  return lines;
}

function mapPublication(service: PostingService, post: Post): RenderedPublication[] {
  return (
    post.posts
      ?.filter((info) => info.service === service.id)
      .map((info) => {
        const link = service.getPublicationUrl(info);
        const engagement = getPublicationEngagement(info);

        return { ...info, engagement, link, published: dateToString(info.published) };
      }) ?? []
  );
}

function renderComment(comment: PostComment, level = 0): string[] {
  const { author, datetime, text, service, replies = [] } = comment;
  const indent = ' '.repeat(level * 2);

  return [
    `${indent}-${level === 0 ? ` \`${esc(service)}\`` : ''} <ins title="${dateToString(
      datetime,
      true,
    )}">${author}</ins> ${esc(text).replace(/(?:\r?\n)+/g, '<br>')}`,
    ...replies.flatMap((comment) => renderComment({ service, ...comment }, level + 1)),
  ];
}

function renderPostContent(
  content: PostContent,
  href: string | undefined,
  previewContent: boolean,
  options: RenderPostsOptions,
): string[] {
  const urls = asArray(content);
  const lines: string[] = [];

  if (previewContent) {
    for (const url of urls) {
      const previewPath = getResourcePreviewPath(url);
      const { name } = parseResourceUrl(url);
      if (previewPath) {
        const src = relativeUrl(options.doc.filename, previewPath);
        if (href) {
          lines.push(`<a href="${esc(href)}" title="${esc(name)}"><img alt="${esc(url)}" src="${esc(src)}" /></a>`);
        } else {
          lines.push(`![${esc(url)}](${esc(src)} "${esc(name)}")`);
        }
      } else {
        lines.push(`[${esc(url)}](${esc(url)})`);
      }
    }
  } else {
    lines.push(...urls.map((url) => `> ${esc(url)}  `));
  }

  return lines;
}

async function renderPostAttributes(post: Post, options: RenderPostsOptions): Promise<string[]> {
  const lines: string[] = [];

  if (post.author) {
    lines.push(
      `by ${(
        await Promise.all(asArray(post.author).map((author) => renderPostContributor(author, undefined, options)))
      ).join(', ')}`,
    );
  } else if (isTrashItem(post)) {
    lines.push(`_cancelled_`);
  } else if (post.request) {
    lines.push(`_pending_`);
  } else {
    lines.push(`by _${USER_UNKNOWN}_`);
  }

  return lines;
}

async function renderPostEntry(postEntry: PostEntry, options: RenderPostsOptions): Promise<string[]> {
  const [id, post, originalId] = postEntry;
  const lines: string[] = [];
  const { postActions } = options;

  const firstPublication = post.posts?.[0];
  let href;

  if (firstPublication) {
    const firstService = postingServiceManagers.find((service) => firstPublication.service === service.id);
    href = firstService?.getPublicationUrl(firstPublication);
  }

  lines.push(`## <span id="${esc(id)}">${esc(post.title || id)}</span>`);
  lines.push('');

  if (post.titleRu) {
    lines.push(`\`RU\` ${esc(post.titleRu)}`);
    lines.push('');
  }

  const previewContent = post.violation !== 'inappropriate-content';

  if (post.content) {
    lines.push(...renderPostContent(post.content, href, previewContent, options));
    lines.push('');
  }

  if (post.trash) {
    lines.push('<details>');
    lines.push('<summary>Trash</summary>');
    lines.push('');
    lines.push(...renderPostContent(post.trash, undefined, previewContent, options));
    lines.push('</details>');
    lines.push('');
  }

  lines.push([`\`${esc(post.type)}\``, ...(await renderPostAttributes(post, options))].join(' '));
  lines.push('');

  if (post.request) {
    lines.push(`> ${esc(post.request.text)}  `);
    lines.push(`> ${await renderPostContributor(post.request.user, post.request.date, options)}`);
    lines.push('');
  }

  if (post.violation) {
    lines.push('> [!CAUTION]', `> ${postViolationDescriptors[post.violation]}.`, '');
  }

  const errors: string[] = [];
  options.postCheck?.(post, errors);
  if (errors.length > 0) {
    lines.push('> [!WARNING]', `> ${capitalizeFirstLetter(errors.join(', '))}.`, '');
  }

  if (post.description || post.descriptionRu) {
    lines.push('### Description');
    lines.push('');

    if (post.description) {
      lines.push(esc(post.description));
      lines.push('');
    }

    if (post.descriptionRu) {
      lines.push(`\`RU\` ${esc(post.descriptionRu)}`);
      lines.push('');
    }
  }

  const tags: string[] = [];

  if (postActions?.includes('edit')) {
    tags.push(`[\`Edit\`](${esc(createEditUrl(id, post))})`);
  }

  if (postActions?.includes('precise')) {
    tags.push(`[\`Precise\`](${esc(createEditUrl(id, post))})`);
  }

  if (postActions?.includes('merge')) {
    tags.push(`[\`Merge\`](${esc(createMergeUrl(id))})`);
  }

  if (post.mark) {
    tags.push(`\`${post.mark}\``);
  }

  if (post.location) {
    tags.push(...asArray(post.location).map((location) => `\`📍 ${location}\``));
  } else if (postActions?.includes('locate')) {
    tags.push(`<code>📍 [Locate](${createLocateUrl(id)})</code>`);
  }

  if (post.engine) {
    tags.push(`\`🚀 ${post.engine}\``);
  }
  if (post.addon) {
    tags.push(`\`🔗 ${post.addon}\``);
  }

  tags.push(...(post.tags?.map((tag) => `\`${tag}\``) || []));

  if (tags.length > 0) {
    lines.push(`${tags.join(' ')}`);
    lines.push('');
  }

  if (id) {
    lines.push('```');
    lines.push(esc(id));
    lines.push('```');
    lines.push('');
  }

  if (originalId) {
    lines.push(`> \`${esc(originalId)}\``);
    lines.push('');
  }

  if (post.posts && post.posts.length > 0) {
    lines.push(...renderPostEntryReactions(postEntry));
  }

  return lines;
}

async function renderPostContributor(id: string, date: Date | undefined, options: RenderPostsOptions): Promise<string> {
  const user = await options.users.getItem(id);

  return `[${esc(user?.name || id)}](${`../contributors.md#${esc(id)}`}${date ? ` "${dateToString(date)}"` : ''})`;
}

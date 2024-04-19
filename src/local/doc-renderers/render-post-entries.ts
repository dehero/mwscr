import { writeFile } from 'fs/promises';
import esc from 'escape-html';
import type { Doc } from '../../core/entities/doc.js';
import type {
  Post,
  PostContent,
  PostEntriesComparator,
  PostEntry,
  PostFilter,
  PostSource,
} from '../../core/entities/post.js';
import {
  getPostEntriesFromSource,
  getPostMaxFollowers,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
  getServicePostRating,
  POST_VIOLATIONS,
} from '../../core/entities/post.js';
import { isTrashItem } from '../../core/entities/post-variation.js';
import { parseResourceUrl } from '../../core/entities/resource.js';
import type { PostingService } from '../../core/entities/service.js';
import type { ServicePostComment } from '../../core/entities/service-post.js';
import type { ReadonlyUsers } from '../../core/entities/user.js';
import { USER_UNKNOWN } from '../../core/entities/user.js';
import { asArray, capitalizeFirstLetter } from '../../core/utils/common-utils.js';
import { dateToString } from '../../core/utils/date-utils.js';
import { getResourcePreviewPath } from '../data-managers/resources.js';
import { createIssueUrl as createEditUrl } from '../github-issues/editing.js';
import { createIssueUrl as createLocateUrl } from '../github-issues/location.js';
import { createIssueUrl as createMergeUrl } from '../github-issues/merging.js';
import { createIssueUrl as createReviewUrl } from '../github-issues/review.js';
import { postingServices } from '../services/index.js';
import { renderNavs } from './utils/doc-utils.js';
import { renderMarkdownTable } from './utils/markdown-utils.js';
import { relativeUrl } from './utils/url-utils.js';

interface RenderedComment extends ServicePostComment {
  service: string;
  replies: RenderedComment[];
}

export interface PostEntriesDoc extends Doc {
  source: PostSource<Post>;
  compareFn?: PostEntriesComparator;
  filterFn?: PostFilter<Post, Post>;
  size?: number;
}

interface RenderedServicePost {
  service?: string;
  published?: string;
  followers?: number;
  likes?: number;
  views?: number;
  rating?: number;
  link?: string;
}

export type RenderedPostAction = 'edit' | 'locate' | 'merge' | 'review';

export interface RenderPostsOptions {
  doc: PostEntriesDoc;
  postActions?: RenderedPostAction[];
  postCheck?: (post: Post, errors?: string[]) => boolean;
  navs: Array<Doc[]>;
  users: ReadonlyUsers;
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

    lines.push(...postEntries.flatMap((postEntry) => renderPostEntry(postEntry, options)));

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

function renderPostReactions(post: Post) {
  const lines: string[] = [];

  lines.push(`### Reactions`);
  lines.push('');

  const serviceInfos: RenderedServicePost[] = [
    ...postingServices
      .flatMap((service) => mapServicePost(service, post))
      .sort((a, b) => a.published?.localeCompare(b.published ?? '') ?? 0),
    {
      likes: getPostTotalLikes(post),
      views: getPostTotalViews(post),
      followers: getPostMaxFollowers(post),
      rating: getPostRating(post),
    },
  ];

  if (serviceInfos.length > 0) {
    lines.push(
      ...renderMarkdownTable(['', 'published', 'views', 'likes', 'followers', 'rating'], serviceInfos, (row, column) =>
        row
          ? column === 'rating'
            ? Number(row.rating?.toFixed(2))
            : column
              ? row[column as keyof RenderedServicePost]
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

  const comments: RenderedComment[] =
    post.posts
      ?.flatMap((post) => mapComments(post.service, post.comments))
      .sort((comment1, comment2) => comment1.datetime.getTime() - comment2.datetime.getTime()) ?? [];

  if (comments.length > 0) {
    lines.push('#### Comments');
    lines.push('');
    lines.push(...comments.flatMap((comment) => renderComment(comment)));
    lines.push('');
  }

  return lines;
}

function mapComments(service: string, comments?: ServicePostComment[]): RenderedComment[] {
  return Array.isArray(comments)
    ? comments.map((comment) => ({ ...comment, service, replies: mapComments(service, comment.replies) }))
    : [];
}

function mapServicePost(service: PostingService, post: Post): RenderedServicePost[] {
  return (
    post.posts
      ?.filter((info) => info.service === service.id)
      .map((info) => {
        const link = service.getServicePostUrl(info);
        const rating = getServicePostRating(info);

        return { ...info, rating, link, published: dateToString(info.published) };
      }) ?? []
  );
}

function renderComment(comment: RenderedComment, level = 0): string[] {
  const { author, datetime, text, service, replies } = comment;
  const indent = ' '.repeat(level * 2);

  return [
    `${indent}-${level === 0 ? ` \`${esc(service)}\`` : ''} <ins title="${dateToString(
      datetime,
      true,
    )}">${author}</ins> ${esc(text).replace(/(?:\r?\n)+/g, '<br>')}`,
    ...replies.flatMap((comment) => renderComment(comment, level + 1)),
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

function renderPostAttributes(post: Post, options: RenderPostsOptions): string[] {
  const lines: string[] = [];

  if (post.author) {
    lines.push(
      `by ${asArray(post.author)
        .map((author) => renderPostContributor(author, undefined, options))
        .join(', ')}`,
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

function renderPostEntry(postEntry: PostEntry<Post>, options: RenderPostsOptions): string[] {
  const [id, post, originalId] = postEntry;
  const lines: string[] = [];
  const { postActions } = options;

  const firstServicePost = post.posts?.[0];
  let href;

  if (firstServicePost) {
    const firstService = postingServices.find((service) => firstServicePost.service === service.id);
    href = firstService?.getServicePostUrl(firstServicePost);
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

  lines.push([`\`${esc(post.type)}\``, ...renderPostAttributes(post, options)].join(' '));
  lines.push('');

  if (post.request) {
    lines.push(`> ${esc(post.request.text)}  `);
    lines.push(`> ${renderPostContributor(post.request.user, post.request.date, options)}`);
    lines.push('');
  }

  if (post.violation) {
    lines.push('> [!CAUTION]', `> ${POST_VIOLATIONS[post.violation]}.`, '');
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

  if (postActions?.includes('review')) {
    tags.push(`[\`Review\`](${esc(createReviewUrl(id))})`);
  }

  if (postActions?.includes('merge')) {
    tags.push(`[\`Merge\`](${esc(createMergeUrl(id))})`);
  }

  if (post.mark) {
    tags.push(`\`${post.mark}\``);
  }

  if (post.location) {
    tags.push(`\`📍 ${post.location}\``);
  } else if (postActions?.includes('locate') && post.type !== 'shot-set') {
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
    lines.push(...renderPostReactions(post));
  }

  return lines;
}

function renderPostContributor(id: string, date: Date | undefined, options: RenderPostsOptions): string {
  const user = options.users.get(id);

  return `[${esc(user?.name || id)}](${`../contributors.md#${esc(id)}`}${date ? ` "${dateToString(date)}"` : ''})`;
}

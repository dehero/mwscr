import { unlink } from 'fs/promises';
import { inbox, published, trash } from '../data-managers/posts.js';
import * as Users from '../data-managers/users.js';
import type { PostEntriesDoc } from '../doc-renderers/render-post-entries.js';
import { renderPostEntriesDoc } from '../doc-renderers/render-post-entries.js';
import { renderUsers } from '../doc-renderers/render-users.js';
import type { Doc } from '../entities/doc.js';
import type { Post } from '../entities/post.js';
import { comparePostEntriesById, comparePostEntriesByRating, getPostEntriesFromSource } from '../entities/post.js';
import { isPostRequest, isPublishablePost, isRevisitablePost, isTrashItem } from '../entities/post-variation.js';
import { createEmptyDir } from '../utils/file-utils.js';

const DOCS_PATH = 'docs';
const PUBLISHED_DOCS_PATH = `${DOCS_PATH}/published`;
const INBOX_DOCS_PATH = `${DOCS_PATH}/inbox`;
const TRASH_DOCS_PATH = `${DOCS_PATH}/trash`;
const CONTRIBUTORS_DOCS_FILENAME = `${DOCS_PATH}/contributors.md`;

const navs: Array<Doc[]> = [
  [
    {
      title: 'README',
      linkText: 'README',
      filename: 'README.md',
    },
    {
      title: 'CONTRIBUTING',
      linkText: 'CONTRIBUTING',
      filename: 'CONTRIBUTING.md',
    },
    {
      title: 'Published',
      linkText: 'Published',
      filename: `${PUBLISHED_DOCS_PATH}/index.md`,
    },
    {
      title: 'Inbox',
      linkText: 'Inbox',
      filename: `${INBOX_DOCS_PATH}/index.md`,
    },
    {
      title: 'Trash',
      linkText: 'Trash',
      filename: `${TRASH_DOCS_PATH}/index.md`,
    },
    {
      title: 'Contributors',
      linkText: 'Contributors',
      filename: CONTRIBUTORS_DOCS_FILENAME,
    },
  ],
];

export async function renderDocs() {
  console.group(`Rendering documents...`);

  try {
    await renderContributors();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error rendering contributors: ${error.message}`);
    }
  }

  try {
    await renderPublishedPosts();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error rendering published posts: ${error.message}`);
    }
  }

  try {
    await renderInbox();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error rendering inbox: ${error.message}`);
    }
  }

  try {
    await renderTrash();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error rendering trash: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function renderPublishedPosts() {
  await createEmptyDir(PUBLISHED_DOCS_PATH);

  const users = await Users.load();
  const years = await published.getChunkNames();
  const docs: PostEntriesDoc[] = [
    {
      title: 'Top Rated',
      linkText: 'Top Rated',
      filename: `${PUBLISHED_DOCS_PATH}/top-rated.md`,
      source: () => published.getAllPosts(true),
      compareFn: comparePostEntriesByRating('desc'),
      size: 50,
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Published in ${year}`,
          linkText: year,
          filename: `${PUBLISHED_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => published.getChunkPosts(year),
          compareFn: comparePostEntriesById('desc'),
        }),
      ),
  ];

  for (const doc of docs) {
    try {
      await renderPostEntriesDoc({
        doc,
        navs: [...navs, docs],
        users,
        postActions: ['locate'],
        postCheck: isPublishablePost,
      });
      console.info(`Rendered "${doc.filename}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error rendering "${doc.filename}": ${error.message}`);
      }
    }
  }
}

async function renderInbox() {
  await createEmptyDir(INBOX_DOCS_PATH);

  const users = await Users.load();
  const years = await inbox.getChunkNames();

  const docs: PostEntriesDoc[] = [
    {
      title: 'Shortlist',
      linkText: 'Shortlist',
      filename: `${INBOX_DOCS_PATH}/shortlist.md`,
      source: inbox.getAllPosts,
      compareFn: comparePostEntriesById('desc'),
      filterFn: isPublishablePost,
    },
    {
      title: 'Requests',
      linkText: 'Requests',
      filename: `${INBOX_DOCS_PATH}/requests.md`,
      source: inbox.getAllPosts,
      filterFn: isPostRequest,
      compareFn: comparePostEntriesById('desc'),
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Inbox for ${year}`,
          linkText: year,
          filename: `${INBOX_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => inbox.getChunkPosts(year),
          filterFn: (post): post is Post => !isPublishablePost(post),
          compareFn: comparePostEntriesById('desc'),
        }),
      ),
  ];

  for (const doc of docs) {
    try {
      await renderPostEntriesDoc({
        doc,
        navs: [...navs, docs],
        postActions: ['review', 'edit', 'merge', 'locate'],
        users,
        postCheck: isPublishablePost,
      });
      console.info(`Rendered "${doc.filename}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error rendering "${doc.filename}": ${error.message}`);
      }
    }
  }
}

async function renderTrash() {
  await createEmptyDir(TRASH_DOCS_PATH);

  const users = await Users.load();
  const years = await trash.getChunkNames();
  const docs: PostEntriesDoc[] = [
    {
      title: 'Revisit',
      linkText: 'Revisit',
      filename: `${TRASH_DOCS_PATH}/revisit.md`,
      source: trash.getAllPosts,
      compareFn: comparePostEntriesById('desc'),
      filterFn: isRevisitablePost,
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Trash for ${year}`,
          linkText: year,
          filename: `${TRASH_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => trash.getChunkPosts(year),
          compareFn: comparePostEntriesById('desc'),
        }),
      ),
  ];

  for (const doc of docs) {
    try {
      await renderPostEntriesDoc({
        doc,
        navs: [...navs, docs],
        users,
        postActions: ['review', 'edit', 'merge', 'locate'],
        postCheck: isTrashItem,
      });
      console.info(`Rendered "${doc.filename}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error rendering "${doc.filename}": ${error.message}`);
      }
    }
  }
}

async function renderContributors() {
  const filename = CONTRIBUTORS_DOCS_FILENAME;
  const publishedPosts = await getPostEntriesFromSource(published.getAllPosts);
  const inboxPosts = await getPostEntriesFromSource(inbox.getAllPosts);
  const trashPosts = await getPostEntriesFromSource(trash.getAllPosts);
  const users = await Users.load();

  try {
    await renderUsers({
      users,
      published: publishedPosts,
      inbox: inboxPosts,
      trash: trashPosts,
      doc: {
        filename,
        title: 'Contributors',
        linkText: 'Contributors',
      },
      navs,
    });
    console.info(`Rendered "${filename}".`);
  } catch (error) {
    await unlink(filename);
    if (error instanceof Error) {
      console.error(`Error rendering "${filename}": ${error.message}`);
    }
  }
}

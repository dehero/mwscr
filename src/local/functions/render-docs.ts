import { unlink } from 'fs/promises';
import type { Doc } from '../../core/entities/doc.js';
import type { Post } from '../../core/entities/post.js';
import { comparePostEntriesById, comparePostEntriesByRating } from '../../core/entities/post.js';
import {
  isPublishablePost,
  isReferenceProposal,
  isRequestProposal,
  isTrashItem,
} from '../../core/entities/posts-manager.js';
import { inbox, posts, postsManagers, trash } from '../data-managers/posts.js';
import { users } from '../data-managers/users.js';
import type { PostEntriesDoc } from '../doc-renderers/render-post-entries.js';
import { renderPostEntriesDoc } from '../doc-renderers/render-post-entries.js';
import { renderUsers } from '../doc-renderers/render-users.js';
import { createEmptyDir } from '../utils/file-utils.js';

const DOCS_PATH = 'docs';
const POSTS_DOCS_PATH = `${DOCS_PATH}/posts`;
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
      title: 'Posts',
      linkText: 'Posts',
      filename: `${POSTS_DOCS_PATH}/index.md`,
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
    await renderPosts();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error rendering posts: ${error.message}`);
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

async function renderPosts() {
  await createEmptyDir(POSTS_DOCS_PATH);

  const years = [...(await posts.getAllChunkNames())];
  const docs: PostEntriesDoc[] = [
    {
      title: 'Top Rated',
      linkText: 'Top Rated',
      filename: `${POSTS_DOCS_PATH}/top-rated.md`,
      source: () => posts.readAllEntries(true),
      compareFn: comparePostEntriesByRating('desc'),
      size: 50,
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Posted in ${year}`,
          linkText: year,
          filename: `${POSTS_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => posts.readChunkEntries(year),
          compareFn: comparePostEntriesById('desc'),
        }),
      ),
  ];

  for (const doc of docs) {
    try {
      await renderPostEntriesDoc({
        doc,
        navs: [...navs, docs],
        postActions: ['precise', 'locate'],
        postCheck: isPublishablePost,
        users,
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

  const years = [...(await inbox.getAllChunkNames())];

  const docs: PostEntriesDoc[] = [
    {
      title: 'Shortlist',
      linkText: 'Shortlist',
      filename: `${INBOX_DOCS_PATH}/shortlist.md`,
      source: inbox.readAllEntries,
      compareFn: comparePostEntriesById('desc'),
      filterFn: isPublishablePost,
    },
    {
      title: 'Requests',
      linkText: 'Requests',
      filename: `${INBOX_DOCS_PATH}/requests.md`,
      source: inbox.readAllEntries,
      filterFn: isRequestProposal,
      compareFn: comparePostEntriesById('desc'),
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Inbox for ${year}`,
          linkText: year,
          filename: `${INBOX_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => inbox.readChunkEntries(year),
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
        postActions: ['edit', 'merge', 'locate'],
        postCheck: isPublishablePost,
        users,
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

  const years = [...(await trash.getAllChunkNames())];
  const docs: PostEntriesDoc[] = [
    {
      title: 'Revisit',
      linkText: 'Revisit',
      filename: `${TRASH_DOCS_PATH}/revisit.md`,
      source: trash.readAllEntries,
      compareFn: comparePostEntriesById('desc'),
      filterFn: isReferenceProposal,
    },
    ...years
      .sort((a, b) => Number(b) - Number(a))
      .map(
        (year, index): PostEntriesDoc => ({
          title: `Trash for ${year}`,
          linkText: year,
          filename: `${TRASH_DOCS_PATH}/${index === 0 ? 'index' : year}.md`,
          source: () => trash.readChunkEntries(year),
          compareFn: comparePostEntriesById('desc'),
        }),
      ),
  ];

  for (const doc of docs) {
    try {
      await renderPostEntriesDoc({
        doc,
        navs: [...navs, docs],
        postActions: ['edit', 'merge', 'locate'],
        postCheck: isTrashItem,
        users,
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

  try {
    await renderUsers({
      users,
      postsManagers,
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

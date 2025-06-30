import {
  getPostContentDistance,
  getPostTypeFromContent,
  mergePostContents,
  mergePostWith,
} from '../../core/entities/post.js';
import type { DraftProposal } from '../../core/entities/posts-manager.js';
import { createDraftId } from '../../core/entities/posts-manager.js';
import { resourceIsImage, resourceIsVideo } from '../../core/entities/resource.js';
import type { StoreItem } from '../../core/entities/store.js';
import { parseStoreResourceUrl, STORE_INBOX_DIR } from '../../core/entities/store.js';
import { asArray, partition } from '../../core/utils/common-utils.js';
import { drafts } from '../data-managers/posts.js';
import { storeManager } from '../store-managers/index.js';

export async function importStoreInbox() {
  console.group(`Importing drafts from store...`);

  const items = await storeManager.readdir(STORE_INBOX_DIR);

  try {
    await importNewItems(items);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing drafts from store: ${error.message}`);
    }
  }

  try {
    await moveDeletedItemsToTrash(items);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error moving deleted drafts to trash: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function importNewItems(items: StoreItem[]) {
  const draftsEntries = await drafts.getAllEntries(true);
  let addedItems = 0;

  for (const item of items) {
    if (!resourceIsImage(item.url) && !resourceIsVideo(item.url)) {
      continue;
    }

    const { author, date, key, originalUrl } = parseStoreResourceUrl(item.url);
    if (!author || !date || !key) {
      continue;
    }

    const { distance } = getPostContentDistance(item.url, draftsEntries);
    if (distance !== Infinity) {
      continue;
    }

    const type = getPostTypeFromContent(item.url);
    if (!type) {
      continue;
    }

    const proposal: DraftProposal = {
      content: item.url,
      type,
      author,
    };

    let id;

    if (originalUrl) {
      ({ id } = getPostContentDistance(originalUrl, draftsEntries));
    }

    if (!id) {
      id = createDraftId(author, date, key);
    }

    const draft = await drafts.getItem(id);

    if (draft) {
      mergePostWith(draft, proposal);
    } else {
      await drafts.addItem(proposal, id);
    }
    await drafts.save();

    console.info(`Imported new draft "${item.url}" to "${id}".`);
    addedItems++;
  }

  if (addedItems === 0) {
    console.info(`No new drafts found in store.`);
  }
}

async function moveDeletedItemsToTrash(items: StoreItem[]) {
  const storeUrls = new Set(items.map(({ url }) => url));
  let processedItems = 0;

  for await (const [id, item] of drafts.readAllEntries()) {
    if (!item.content || item.content.length === 0) {
      continue;
    }

    const [content, trash] = partition(
      asArray(item.content),
      (url) => parseStoreResourceUrl(url).dir !== STORE_INBOX_DIR || storeUrls.has(url),
    );

    if (content.length === 0 && !item.request) {
      item.mark = 'D';

      await drafts.save();

      console.info(`Rejected draft "${id}".`);
      processedItems++;
    } else if (trash.length > 0) {
      item.content = mergePostContents(content);
      item.trash = mergePostContents(item.trash, trash);

      await drafts.save();

      console.info(`Moved "${trash.join('", "')}" to trash for draft "${id}".`);
      processedItems++;
    }
  }

  if (processedItems === 0) {
    console.info(`No drafts moved to trash.`);
  }
}

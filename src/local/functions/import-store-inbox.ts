import {
  getPostContentDistance,
  getPostTypeFromContent,
  mergePostContents,
  mergePostWith,
} from '../../core/entities/post.js';
import type { PostDraft } from '../../core/entities/post-variation.js';
import { resourceIsImage, resourceIsVideo } from '../../core/entities/resource.js';
import type { StoreItem } from '../../core/entities/store.js';
import { parseStoreResourceUrl, STORE_INBOX_DIR } from '../../core/entities/store.js';
import { asArray, partition } from '../../core/utils/common-utils.js';
import { createInboxItemId, inbox } from '../data-managers/posts.js';
import { storeManager } from '../store-managers/index.js';

export async function importStoreInbox() {
  console.group(`Importing inbox from store...`);

  const items = await storeManager.readdir(STORE_INBOX_DIR);

  try {
    await importNewItems(items);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing inbox items from store: ${error.message}`);
    }
  }

  try {
    await moveDeletedItemsToTrash(items);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error moving deleted inbox items to trash: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function importNewItems(items: StoreItem[]) {
  const inboxEntries = await inbox.getAllEntries(true);
  let addedItems = 0;

  for (const item of items) {
    if (!resourceIsImage(item.url) && !resourceIsVideo(item.url)) {
      continue;
    }

    const { author, date, key, originalUrl } = parseStoreResourceUrl(item.url);
    if (!author || !date || !key) {
      continue;
    }

    const { distance } = getPostContentDistance(item.url, inboxEntries);
    if (distance !== Infinity) {
      continue;
    }

    const type = getPostTypeFromContent(item.url);
    if (!type) {
      continue;
    }

    const draft: PostDraft = {
      content: item.url,
      type,
      author,
    };

    let id;

    if (originalUrl) {
      ({ id } = getPostContentDistance(originalUrl, inboxEntries));
    }

    if (!id) {
      id = createInboxItemId(author, date, key);
    }

    const inboxItem = await inbox.getItem(id);

    if (inboxItem) {
      mergePostWith(inboxItem, draft);
      await inbox.updateItem(id);
    } else {
      await inbox.addItem(draft, id);
    }

    console.info(`Imported new inbox item "${item.url}" to "${id}".`);
    addedItems++;
  }

  if (addedItems === 0) {
    console.info(`No new inbox items found in store.`);
  }
}

async function moveDeletedItemsToTrash(items: StoreItem[]) {
  const storeUrls = new Set(items.map(({ url }) => url));
  let processedItems = 0;

  for await (const [id, item] of inbox.readAllEntries()) {
    if (!item.content || item.content.length === 0) {
      continue;
    }

    const [content, trash] = partition(
      asArray(item.content),
      (url) => parseStoreResourceUrl(url).dir !== STORE_INBOX_DIR || storeUrls.has(url),
    );

    if (content.length === 0 && !item.request) {
      item.mark = 'D';

      await inbox.updateItem(id);

      console.info(`Rejected inbox item "${id}".`);
      processedItems++;
    } else if (trash.length > 0) {
      item.content = mergePostContents(content);
      item.trash = mergePostContents(item.trash, trash);

      await inbox.updateItem(id);

      console.info(`Moved "${trash.join('", "')}" to trash for inbox item "${id}".`);
      processedItems++;
    }
  }

  if (processedItems === 0) {
    console.info(`No inbox items moved to trash.`);
  }
}

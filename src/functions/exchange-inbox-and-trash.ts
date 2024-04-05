import { inbox, trash } from '../data-managers/posts.js';
import { moveInboxItemResourcesToTrash, restoreTrashItemResources } from '../data-managers/store-resources.js';
import { isTrashItem } from '../entities/post-variation.js';

export async function exchangeInboxAndTrash() {
  console.group('Exchanging inbox and trash...');

  await cleanupInbox();

  await tryRestoreTrashItems();

  console.groupEnd();
}

async function cleanupInbox() {
  console.info('Cleaning inbox...');

  try {
    for await (const [id, item] of inbox.getAllPosts()) {
      if (isTrashItem(item)) {
        try {
          await moveInboxItemResourcesToTrash(item);
          await inbox.removePost(id);
          await trash.addPost(id, item);

          console.info(`Moved rejected inbox item "${id}" to trash.`);
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Error moving resources for rejected inbox item "${id}": ${error.message}.`);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error cleaning inbox: ${error.message}`);
    }
  }
}

async function tryRestoreTrashItems() {
  console.info('Searching for trash items to restore...');

  try {
    for await (const [id, item] of trash.getAllPosts()) {
      if (!isTrashItem(item)) {
        try {
          await restoreTrashItemResources(item);
          await trash.removePost(id);
          await inbox.addPost(id, item);

          console.info(`Restored trash item "${id}".`);
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Error restoring resources for trash item "${id}": ${error.message}.`);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error restoring trash items: ${error.message}`);
    }
  }
}

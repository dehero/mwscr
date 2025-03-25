import { isTrashItem } from '../../core/entities/posts-manager.js';
import { inbox, trash } from '../data-managers/posts.js';
import { moveInboxItemResourcesToTrash, restoreTrashItemResources } from '../data-managers/store-resources.js';

export async function exchangeInboxAndTrash() {
  console.group('Exchanging inbox and trash...');

  await cleanupInbox();

  await tryRestoreTrashItems();

  console.groupEnd();
}

async function cleanupInbox() {
  console.info('Cleaning inbox...');

  try {
    for await (const [id, item] of inbox.readAllEntries()) {
      if (isTrashItem(item)) {
        try {
          await moveInboxItemResourcesToTrash(item);
          await trash.addItem(item, id);
          await inbox.removeItem(id);

          await trash.save();
          await inbox.save();

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
    for await (const [id, item] of trash.readAllEntries()) {
      if (!isTrashItem(item)) {
        try {
          await restoreTrashItemResources(item);
          await inbox.addItem(item, id);
          await trash.removeItem(id);

          await inbox.save();
          await trash.save();

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

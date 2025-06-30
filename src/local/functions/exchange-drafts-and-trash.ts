import { isTrashItem } from '../../core/entities/posts-manager.js';
import { drafts, trash } from '../data-managers/posts.js';
import { moveDraftResourcesToTrash, restoreTrashItemResources } from '../data-managers/store-resources.js';

export async function exchangeDraftsAndTrash() {
  console.group('Exchanging drafts and trash...');

  await cleanupDrafts();

  await tryRestoreTrashItems();

  console.groupEnd();
}

async function cleanupDrafts() {
  console.info('Cleaning drafts...');

  try {
    for await (const [id, item] of drafts.readAllEntries()) {
      if (isTrashItem(item)) {
        try {
          await moveDraftResourcesToTrash(item);
          await trash.addItem(item, id);
          await drafts.removeItem(id);

          await trash.save();
          await drafts.save();

          console.info(`Moved rejected draft "${id}" to trash.`);
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Error moving resources for rejected draft "${id}": ${error.message}.`);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error cleaning drafts: ${error.message}`);
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
          await drafts.addItem(item, id);
          await trash.removeItem(id);

          await drafts.save();
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

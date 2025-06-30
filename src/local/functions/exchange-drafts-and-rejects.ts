import { isReject } from '../../core/entities/posts-manager.js';
import { drafts, rejects } from '../data-managers/posts.js';
import { moveDraftResourcesToTrash, restoreRejectResources } from '../data-managers/store-resources.js';

export async function exchangeDraftsAndRejects() {
  console.group('Exchanging drafts and rejects...');

  await cleanupDrafts();

  await tryRestoreRejects();

  console.groupEnd();
}

async function cleanupDrafts() {
  console.info('Cleaning drafts...');

  try {
    for await (const [id, item] of drafts.readAllEntries()) {
      if (isReject(item)) {
        try {
          await moveDraftResourcesToTrash(item);
          await rejects.addItem(item, id);
          await drafts.removeItem(id);

          await rejects.save();
          await drafts.save();

          console.info(`Moved rejected draft "${id}" to rejects.`);
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

async function tryRestoreRejects() {
  console.info('Searching for rejects to restore...');

  try {
    for await (const [id, item] of rejects.readAllEntries()) {
      if (!isReject(item)) {
        try {
          await restoreRejectResources(item);
          await drafts.addItem(item, id);
          await rejects.removeItem(id);

          await drafts.save();
          await rejects.save();

          console.info(`Restored reject "${id}".`);
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Error restoring resources for reject "${id}": ${error.message}.`);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error restoring rejects: ${error.message}`);
    }
  }
}

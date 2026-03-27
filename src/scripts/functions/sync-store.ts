import { storeManager } from '../store-managers/index.js';

export async function syncStore() {
  console.group(`Synchronizing store...`);

  try {
    let hasSynced = false;
    for await (const [store, item] of storeManager.sync()) {
      console.info(`Synchronized "${item.url}" to ${store.name} store.`);
      hasSynced = true;
    }

    if (!hasSynced) {
      console.info('No items were synchronized.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error synchronizing store: ${error.message}`);
    }
  }

  console.groupEnd();
}

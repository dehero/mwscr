import type { StoreItem, StoreManager } from '../../core/entities/store.js';
import { storeIncludesPath } from '../../core/entities/store.js';
import { store } from '../../core/stores/index.js';
import { partition } from '../../core/utils/common-utils.js';
import { localStoreManager } from './local-store-manager.js';
import { siteStoreManager } from './site-store-manager.js';
import { yandexDiskManager } from './yandex-disk-manager.js';

const storeManagers: StoreManager[] = [localStoreManager, yandexDiskManager, siteStoreManager];

export const storeManager: StoreManager = {
  ...store,

  async copy(from: string, to: string): Promise<void> {
    const [fromToStores, restStores] = partition(storeManagers, storeIncludesPath(from, to));
    const toStores = restStores.filter(storeIncludesPath(to));

    if (fromToStores.length === 0 && toStores.length === 0) {
      throw new Error(`No stores found to copy from "${from}" to "${to}"`);
    }

    try {
      if (toStores.length > 0) {
        const stream = await this.getStream(from);
        if (stream) {
          await Promise.all(toStores.map((store) => store.putStream(to, stream)));
        }
      }

      if (fromToStores.length > 0) {
        await Promise.all(fromToStores.map((store) => store.copy(from, to)));
      }
    } catch (error) {
      try {
        await this.remove(to);
      } catch {
        // TODO: handle no rollback error
      }

      throw error;
    }
  },

  async exists(path: string): Promise<boolean> {
    const [store] = storeManagers.filter(storeIncludesPath(path));
    if (store) {
      return store.exists(path);
    }

    throw new Error(`No store found for "${path}"`);
  },

  async get(path: string): Promise<Buffer> {
    const [store] = storeManagers.filter(storeIncludesPath(path));
    if (store) {
      return store.get(path);
    }

    throw new Error(`No store found for "${path}"`);
  },

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const [store] = storeManagers.filter(storeIncludesPath(path));
    if (store) {
      return store.getStream(path);
    }

    throw new Error(`No store found for "${path}"`);
  },

  getPublicUrl: store.getPublicUrl,

  async move(from: string, to: string): Promise<void> {
    const [fromToStores, restStores] = partition(storeManagers, storeIncludesPath(from, to));
    const toStores = restStores.filter(storeIncludesPath(to));
    const fromStores = restStores.filter(storeIncludesPath(from));

    if (fromToStores.length === 0 && toStores.length === 0 && fromStores.length === 0) {
      throw new Error(`No stores found to move from "${from}" to "${to}"`);
    }

    try {
      if (toStores.length > 0) {
        const stream = await this.getStream(from);
        if (stream) {
          await Promise.all(toStores.map((store) => store.putStream(to, stream)));
        }
      }

      if (fromStores.length > 0) {
        await Promise.all(fromStores.map((store) => store.remove(from)));
      }

      if (fromToStores.length > 0) {
        await Promise.all(fromToStores.map((store) => store.move(from, to)));
      }
    } catch (error) {
      try {
        await Promise.allSettled(fromToStores.map((store) => store.move(to, from)));

        if (fromStores.length > 0) {
          const stream = await Promise.any([this.getStream(from), this.getStream(to)]);

          if (stream) {
            await Promise.allSettled(fromStores.map((store) => store.putStream(from, stream)));
          }
        }

        await Promise.allSettled(toStores.map((store) => store.remove(to)));
      } catch {
        // TODO: handle no rollback error
      }

      throw error;
    }
  },

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    try {
      await Promise.all(storeManagers.filter(storeIncludesPath(path)).map((store) => store.put(path, data)));
    } catch (error) {
      try {
        await this.remove(path);
      } catch {
        // TODO: handle no rollback error
      }
      throw error;
    }
  },

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    try {
      await Promise.all(storeManagers.filter(storeIncludesPath(path)).map((store) => store.putStream(path, stream)));
    } catch (error) {
      await this.remove(path);
      throw error;
    }
  },

  async readdir(path: string): Promise<StoreItem[]> {
    const [store] = storeManagers.filter(storeIncludesPath(path));
    if (store) {
      return store.readdir(path);
    }

    throw new Error(`No store found for "${path}"`);
  },

  async remove(path: string): Promise<void> {
    try {
      await Promise.all(storeManagers.filter(storeIncludesPath(path)).map((store) => store.remove(path)));
    } catch (error) {
      const stream = await this.getStream(path);

      if (stream) {
        this.putStream(path, stream);
      }

      throw error;
    }
  },
};

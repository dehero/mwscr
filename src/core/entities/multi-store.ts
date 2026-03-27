import { partition } from '../utils/common-utils.js';
import type { Store, StoreItem, StoreManager } from './store.js';
import { storeIncludesPath } from './store.js';

export class MultiStore implements Store {
  readonly name = 'Multi';
  readonly stores: Store[];

  constructor(stores: Store[]) {
    this.stores = stores;
  }

  getPublicUrl(path: string): string | undefined {
    for (const store of this.stores.filter(storeIncludesPath(path))) {
      const url = store.getPublicUrl(path);
      if (url) {
        return url;
      }
    }

    return undefined;
  }

  async getPreviewUrl(path: string, width?: number, height?: number): Promise<string | undefined> {
    for (const store of this.stores.filter(storeIncludesPath(path))) {
      return store.getPreviewUrl(path, width, height);
    }

    throw new Error(`No store found for "${path}"`);
  }
}

export class MultiStoreManager extends MultiStore implements StoreManager {
  readonly stores: StoreManager[];

  constructor(stores: StoreManager[]) {
    super(stores);
    this.stores = stores;
  }

  async copy(from: string, to: string): Promise<void> {
    const [fromToStores, restStores] = partition(this.stores, storeIncludesPath(from, to));
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
  }

  async exists(path: string): Promise<false | StoreItem> {
    const [store] = this.stores.filter(storeIncludesPath(path));
    if (store) {
      return store.exists(path);
    }

    throw new Error(`No store found for "${path}"`);
  }

  async get(path: string): Promise<Buffer> {
    const [store] = this.stores.filter(storeIncludesPath(path));
    if (store) {
      return store.get(path);
    }

    throw new Error(`No store found for "${path}"`);
  }

  async getStream(path: string): Promise<NodeJS.ReadableStream | null> {
    const [store] = this.stores.filter(storeIncludesPath(path));
    if (store) {
      return store.getStream(path);
    }

    throw new Error(`No store found for "${path}"`);
  }

  async move(from: string, to: string): Promise<void> {
    const [fromToStores, restStores] = partition(this.stores, storeIncludesPath(from, to));
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
  }

  async put(path: string, data: Iterable<unknown> | AsyncIterable<unknown>): Promise<void> {
    try {
      await Promise.all(this.stores.filter(storeIncludesPath(path)).map((store) => store.put(path, data)));
    } catch (error) {
      try {
        await this.remove(path);
      } catch {
        // TODO: handle no rollback error
      }
      throw error;
    }
  }

  async putStream(path: string, stream: NodeJS.ReadableStream): Promise<void> {
    try {
      await Promise.all(this.stores.filter(storeIncludesPath(path)).map((store) => store.putStream(path, stream)));
    } catch (error) {
      await this.remove(path);
      throw error;
    }
  }

  async readdir(path: string): Promise<StoreItem[]> {
    const store = this.stores.find(storeIncludesPath(path));
    if (store) {
      return store.readdir(path);
    }

    throw new Error(`No store found for "${path}"`);
  }

  async remove(path: string): Promise<void> {
    try {
      await Promise.all(this.stores.filter(storeIncludesPath(path)).map((store) => store.remove(path)));
    } catch (error) {
      const stream = await this.getStream(path);

      if (stream) {
        this.putStream(path, stream);
      }

      throw error;
    }
  }

  async *sync(path = ''): AsyncGenerator<[Store, StoreItem]> {
    const [[sourceStore], otherStores] = partition(this.stores, (store) => typeof store.include === 'undefined');

    if (!sourceStore) {
      throw new Error('No source store found for synchronization');
    }

    if (otherStores.length === 0) {
      return;
    }

    const items = await sourceStore.readdir(path);

    for (const item of items) {
      const itemPath = path ? `${path.replace(/\/?$/, '/')}${item.name}` : item.name;

      if (item.isDirectory) {
        yield* this.sync(itemPath);
        continue;
      }

      const targetStores = otherStores.filter(storeIncludesPath(itemPath));

      for (const targetStore of targetStores) {
        if (await targetStore.exists(itemPath)) {
          continue;
        }

        const stream = await sourceStore.getStream(itemPath);
        if (stream) {
          await targetStore.putStream(itemPath, stream);
          yield [targetStore, item];
        }
      }
    }
  }
}

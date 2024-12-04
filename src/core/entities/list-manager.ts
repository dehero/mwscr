import { arrayFromAsync, listItems } from '../utils/common-utils.js';

export const LIST_READER_CHUNK_NAME_DEFAULT = 'default';

export type ListReaderEntry<TItem> = [id: string, item: TItem, refId?: string];

export type ListReaderChunk<TItem> = Map<string, TItem | string>;

export type ListReaderStats = ReadonlyMap<string, number>;

export abstract class ListReader<TItem> {
  abstract readonly name: string;

  protected loadedChunkNames: string[] | undefined;
  protected chunks: Map<string, Promise<ListReaderChunk<TItem>>> = new Map();

  protected statsCaches: Record<string, Promise<ListReaderStats>> = {};

  protected async createStatsCache(key: string, creator: () => Promise<ListReaderStats>): Promise<ListReaderStats> {
    if (!this.statsCaches[key]) {
      this.statsCaches[key] = creator();
    }
    return this.statsCaches[key] as Promise<ListReaderStats>;
  }

  protected clearStateCaches() {
    this.statsCaches = {};
  }

  async getChunkNames(): Promise<string[]> {
    if (!this.loadedChunkNames) {
      this.loadedChunkNames = await this.loadChunkNames();
    }

    return [...new Set([...this.loadedChunkNames, ...this.chunks.keys()])];
  }

  async getItemCount(): Promise<number> {
    const chunkNames = await this.getChunkNames();
    let count = 0;

    for (const chunkName of chunkNames) {
      const chunk = await this.loadChunk(chunkName);
      count += chunk.size;
    }

    return count;
  }

  protected getItemChunkName(_id: string) {
    return LIST_READER_CHUNK_NAME_DEFAULT;
  }

  async getItem(id: string): Promise<TItem | undefined> {
    return (await this.getEntry(id))[1];
  }

  async getAllEntries(skipReferences?: boolean): Promise<ListReaderEntry<TItem>[]> {
    return arrayFromAsync(this.readAllEntries(skipReferences));
  }

  async getChunkEntries(chunkName: string, skipReferences?: boolean): Promise<ListReaderEntry<TItem>[]> {
    return arrayFromAsync(this.readChunkEntries(chunkName, skipReferences));
  }

  async getEntry(id: string): Promise<ListReaderEntry<TItem | undefined>> {
    const chunkName = this.getItemChunkName(id);
    const chunk = await this.loadChunk(chunkName);
    const item = chunk.get(id);

    if (typeof item === 'string') {
      const entry = await this.getEntry(item);

      return [id, entry[1], entry[2] || item];
    }

    return [id, item];
  }

  async getEntries(ids: string[]): Promise<ListReaderEntry<TItem | undefined>[]> {
    return Promise.all(ids.map((id) => this.getEntry(id)));
  }

  async findEntry(value: Partial<TItem>): Promise<ListReaderEntry<TItem> | undefined> {
    for await (const entry of this.readAllEntries(true)) {
      if (this.isItemEqual(entry[1], value)) {
        return entry;
      }
    }
    return undefined;
  }

  async findEntries(values: Partial<TItem>[]): Promise<Array<ListReaderEntry<TItem> | undefined>> {
    return Promise.all(values.map((value) => this.findEntry(value)));
  }

  readAllEntries = (skipReferences?: boolean) => this.yieldAllEntries(skipReferences);

  readChunkEntries = (chunkName: string, skipReferences?: boolean) => this.yieldChunkEntries(chunkName, skipReferences);

  protected abstract isItemEqual(a: TItem, b: Partial<TItem>): boolean;

  protected async loadChunk(chunkName: string): Promise<ListReaderChunk<TItem>> {
    let chunk = this.chunks.get(chunkName);
    if (!chunk) {
      chunk = (async () => {
        try {
          const data = await this.loadChunkData(chunkName);

          return new Map(data);
        } catch (error) {
          throw new TypeError(
            `Cannot load ${this.name} chunk "${chunkName}" data: ${error instanceof Error ? error.message : error}`,
          );
        }
      })();

      this.chunks.set(chunkName, chunk);
    }

    return chunk;
  }

  protected abstract loadChunkData(chunkName: string): Promise<Array<[string, TItem | string]>>;

  protected async loadChunkNames(): Promise<string[]> {
    return [LIST_READER_CHUNK_NAME_DEFAULT];
  }

  protected async *yieldAllEntries(skipReferences?: boolean): AsyncGenerator<ListReaderEntry<TItem>> {
    const chunkNames = await this.getChunkNames();

    for (const chunkName of chunkNames) {
      yield* this.yieldChunkEntries(chunkName, skipReferences);
    }
  }

  protected async *yieldChunkEntries(
    chunkName: string,
    skipReferences?: boolean,
  ): AsyncGenerator<ListReaderEntry<TItem>> {
    const chunk = await this.loadChunk(chunkName);

    for (const [key, value] of chunk) {
      if (typeof value === 'string') {
        if (!skipReferences) {
          const item = await this.getItem(value);
          if (!item) {
            throw new Error(`Item "${value}" not found`);
          }
          yield [key, item, value];
        }
      } else {
        yield [key, value];
      }
    }
  }
}

export abstract class ListManager<TItem> extends ListReader<TItem> {
  async addItem(item: TItem | string, id: string) {
    const chunkName = this.getItemChunkName(id);

    const chunk = await this.loadChunk(chunkName);
    chunk.set(id, item);

    this.clearStateCaches();

    return this.saveChunk(chunkName);
  }

  async mergeItem(item: TItem): Promise<ListReaderEntry<TItem>> {
    const entry = await this.findEntry(item);

    if (!entry) {
      const id = this.createItemId(item);
      if (!id) {
        throw new Error(`Cannot create item ID for ${JSON.stringify(item)}`);
      }

      await this.addItem(item, id);

      return [id, item];
    }

    this.mergeItemWith(entry[1], item);
    await this.updateItem(entry[0]);

    return entry;
  }

  async removeItem(id: string) {
    const chunkName = this.getItemChunkName(id);
    const chunk = await this.loadChunk(chunkName);

    chunk.delete(id);

    this.clearStateCaches();

    return this.saveChunk(chunkName);
  }

  async updateItem(id: string) {
    const chunkName = this.getItemChunkName(id);
    const chunk = await this.loadChunk(chunkName);
    const item = chunk.get(id);

    const refId = typeof item === 'string' ? item : id;
    const refChunkName = this.getItemChunkName(refId);

    this.clearStateCaches();

    return this.saveChunk(refChunkName);
  }

  protected createItemId(_item: TItem): string | undefined {
    throw new Error(`Implement ${this.constructor.name}.createItemId method`);
  }

  protected abstract mergeItemWith(item: TItem, withItem: TItem): void;

  protected abstract saveChunk(chunkName: string): Promise<void>;
}

export async function searchListReaderItem<
  TListReader extends ListReader<unknown>,
  TItem extends TListReader extends ListReader<infer T> ? T : never,
>(id: string, managers: TListReader[]): Promise<[TItem, TListReader]> {
  for (const manager of managers) {
    const item = await manager.getItem(id);
    if (item) {
      return [item as TItem, manager];
    }
  }

  throw new Error(`Cannot find items "${id}" through ${listItems(managers.map(({ name }) => name))} items.`);
}

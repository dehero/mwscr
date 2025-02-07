import { DeepProxy } from 'proxy-deep';
import type { InferOutput } from 'valibot';
import { null as nullSchema, picklist, record, string, undefined as undefinedSchema, union } from 'valibot';
import { arrayFromAsync, listItems } from '../utils/common-utils.js';
import { getObjectValue, isObject, isPlainObject, mergeObjects, setObjectValue } from '../utils/object-utils.js';
import { Patch, patchObject } from './patch.js';
import type { ObjectSchema, RecordSchema, Schema } from './schema.js';
import { checkSchema, parseSchema } from './schema.js';

export const LIST_READER_CHUNK_NAME_DEFAULT = 'default';

export const ListReaderItemStatus = picklist(['added', 'changed', 'removed']);

export type ListReaderEntry<TItem> = [id: string, item: TItem, refId?: string];

export type ListReaderChunk<TItem> = Record<string, TItem | string>;

export type ListReaderStats = ReadonlyMap<string, number>;

export type ListReaderItemStatus = InferOutput<typeof ListReaderItemStatus>;

export abstract class ListReader<TItem> {
  abstract readonly name: string;

  protected savedChunkNames: Promise<Set<string>> | undefined;
  protected chunks: Map<string, Promise<ListReaderChunk<TItem>>> = new Map();

  protected cache: Record<string, unknown> = {};

  protected createChunk(_chunkName: string, data: ListReaderChunk<TItem>): ListReaderChunk<TItem> {
    return data;
  }

  protected async createCache<T>(key: string, creator: () => Promise<T>): Promise<T> {
    if (!this.cache[key]) {
      this.cache[key] = creator();
    }
    return this.cache[key] as T;
  }

  protected clearCache() {
    this.cache = {};
  }

  /**
   * Returns a list of all chunk names used in the list, including the initial
   * chunks loaded from `loadChunkNames` and any chunks added later.
   */
  async getAllChunkNames(): Promise<Set<string>> {
    return this.getSavedChunkNames();
  }

  async getSavedChunkNames(): Promise<Set<string>> {
    if (!this.savedChunkNames) {
      this.savedChunkNames = (async () => new Set(await this.loadChunkNames()))();
    }

    return this.savedChunkNames;
  }

  /**
   * Returns the total number of items in the list across all chunks.
   */
  async getItemCount(): Promise<number> {
    const chunkNames = await this.getAllChunkNames();
    let count = 0;

    for (const chunkName of chunkNames) {
      const chunk = await this.loadChunk(chunkName);
      count += Object.getOwnPropertyNames(chunk).length;
    }

    return count;
  }

  /**
   * Returns the name of the chunk that should contain the item with the given
   * ID. This is used to group items together into chunks when loading and
   * saving the list.
   */
  protected getItemChunkName(_id: string) {
    return LIST_READER_CHUNK_NAME_DEFAULT;
  }

  /**
   * Returns the item with the given ID, or undefined if the item does not exist in the list.
   */
  async getItem(id: string): Promise<TItem | undefined> {
    return (await this.getEntry(id))[1];
  }

  /**
   * Returns all entries in the list, optionally skipping references.
   */
  async getAllEntries(skipReferences?: boolean): Promise<ListReaderEntry<TItem>[]> {
    return arrayFromAsync(this.readAllEntries(skipReferences));
  }

  /**
   * Returns all entries in the given chunk, optionally skipping references.
   */
  async getChunkEntries(chunkName: string, skipReferences?: boolean): Promise<ListReaderEntry<TItem>[]> {
    return arrayFromAsync(this.readChunkEntries(chunkName, skipReferences));
  }

  /**
   * Returns the entry with the given ID, or undefined if the entry does not exist in the list.
   * If the entry is a reference, it will be resolved and the referenced entry will be returned.
   * If the referenced entry is another reference, it will be resolved recursively until a non-reference entry is found.
   * The resolved entry will be returned, with the ID of the original entry and the resolved entry's ID as the reference.
   * If the referenced entry does not exist, the original ID will be returned with undefined as the entry.
   */
  async getEntry(id: string): Promise<ListReaderEntry<TItem | undefined>> {
    const chunkName = this.getItemChunkName(id);
    const allChunkNames = await this.getAllChunkNames();

    if (!allChunkNames.has(chunkName)) {
      return [id, undefined];
    }

    const chunk = await this.loadChunk(chunkName);
    const item = chunk[id];

    if (typeof item === 'string') {
      const entry = await this.getEntry(item);

      return [id, entry[1], entry[2] || item];
    }

    return [id, item];
  }

  /**
   * Returns an array of all entries in the list with the given IDs. If any of
   * the IDs do not correspond to an item in the list, the returned array will
   * contain an entry with `undefined` as the item value.
   */
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

  /**
   * Loads a chunk of the list by name. If the chunk is not already in memory,
   * it will be loaded from storage. If the chunk does not exist, a TypeError
   * will be thrown.
   * @throws TypeError if the chunk data could not be loaded.
   */
  protected async loadChunk(chunkName: string): Promise<ListReaderChunk<TItem>> {
    let chunk = this.chunks.get(chunkName);
    if (!chunk) {
      chunk = (async () => {
        try {
          const savedChunkNames = await this.getSavedChunkNames();
          const allChunkNames = await this.getAllChunkNames();
          let data;

          if (savedChunkNames.has(chunkName)) {
            data = await this.loadChunkData(chunkName);
          } else if (allChunkNames.has(chunkName)) {
            data = {};
          } else {
            throw new Error(`Chunk "${chunkName}" not found`);
          }

          return this.createChunk(chunkName, data);
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

  /**
   * Loads the data for a chunk of the list by name. This method must be
   * implemented by subclasses and should return a Promise that resolves to
   * the loaded data, which must be an object with string keys and values
   * that are either `TItem` objects or strings referring to items in other
   * chunks.
   */
  protected abstract loadChunkData(chunkName: string): Promise<ListReaderChunk<TItem>>;

  /**
   * Returns a list of saved chunk names used by the list. The default
   * implementation returns a single chunk named
   * {@link LIST_READER_CHUNK_NAME_DEFAULT}. Override this method to
   * return a different list of chunk names.
   */
  protected async loadChunkNames(): Promise<string[]> {
    return [LIST_READER_CHUNK_NAME_DEFAULT];
  }

  /**
   * Yields all entries in the list, including entries in all chunks, and
   * optionally skipping references. This is a convenience method for
   * iterating over all entries in the list.
   */
  protected async *yieldAllEntries(skipReferences?: boolean): AsyncGenerator<ListReaderEntry<TItem>> {
    const chunkNames = await this.getAllChunkNames();

    for (const chunkName of chunkNames) {
      yield* this.yieldChunkEntries(chunkName, skipReferences);
    }
  }

  /**
   * Yields all entries in the given chunk, and optionally skipping references.
   * If an entry is a reference, it will be resolved and the referenced entry will be yielded.
   * @throws Error if the referenced entry does not exist.
   */
  protected async *yieldChunkEntries(
    chunkName: string,
    skipReferences?: boolean,
  ): AsyncGenerator<ListReaderEntry<TItem>> {
    const chunk = await this.loadChunk(chunkName);

    for (const key of Object.getOwnPropertyNames(chunk)) {
      const value = chunk[key] as TItem | string;
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

export const ListManagerPatch = <TItem extends object>(ItemSchema: ObjectSchema<TItem>) =>
  record(string(), union([ItemSchema, Patch(ItemSchema), string(), nullSchema(), undefinedSchema()])) as RecordSchema<
    string,
    TItem | Patch<TItem> | string | null | undefined
  >;

export type ListManagerPatch<TItem extends object> = InferOutput<ReturnType<typeof ListManagerPatch<TItem>>>;

export class ListManagerChunkProxy<TItem extends object> extends DeepProxy<ListReaderChunk<TItem>> {
  /**
   * Creates a proxy for the given chunk data that will apply the patches in the given manager to the data.
   * If the manager's `skipProxy` property is true, the proxy will not be used.
   */
  constructor(manager: ListManager<TItem>, chunkName: string, data: ListReaderChunk<TItem>) {
    super(data, {
      /**
       * Traps the [[Get]] operation on the proxy and applies the patches in the given manager to the value being retrieved.
       * If the manager's `skipProxy` property is true, the original value will be returned.
       * If the value is an object or array, it will be recursively proxied.
       * If a patch value is found, it will be returned instead of the original value.
       * If the patch value is null, the property will be deleted from the original object.
       */
      get(target, key, receiver) {
        if (key === 'toJSON') {
          return () => {
            const value = structuredClone(target);
            const patchValue = getObjectValue(manager.getChunkPatch(chunkName), this.path);

            if ((isPlainObject(value) || Array.isArray(value)) && isPlainObject(patchValue)) {
              patchObject(value, patchValue as Patch<typeof value>);
            }

            return value;
          };
        }

        const value = Reflect.get(target, key, receiver);
        if (manager.skipProxy) {
          return value;
        }

        const patchValue = getObjectValue(manager.getChunkPatch(chunkName), [...this.path, key.toString()]);
        if (patchValue === null) {
          return undefined;
        }

        if (
          (isPlainObject(patchValue) || typeof patchValue === 'undefined') &&
          (isPlainObject(value) || Array.isArray(value))
        ) {
          return this.nest(value);
        }

        if (typeof patchValue !== 'undefined') {
          return patchValue;
        }

        return value;
      },
      /**
       * Traps the [[Set]] operation on the proxy and applies the patches in the given manager to the value being set.
       * If the manager's `skipProxy` property is true, the original value will be set.
       * Otherwise the change will be saved to manager patch.
       */
      set(target, key, value, receiver) {
        if (manager.skipProxy) {
          Reflect.set(target, key, value, receiver);
          return true;
        }

        const patch = {};
        const patchValue = typeof value === 'undefined' ? null : value;

        setObjectValue(patch, [...this.path, key.toString()], patchValue);
        manager.mergePatch(patch);

        return true;
      },
      ownKeys(target) {
        const result = Reflect.ownKeys(target);
        const patchValue = getObjectValue(manager.getChunkPatch(chunkName), this.path);

        // TODO: check Array.isArray(patchValue)
        if (isPlainObject(patchValue)) {
          const newKeys = Object.entries(patchValue)
            .filter(([_, value]) => value !== null)
            .map(([key]) => key);

          return [
            ...new Set([...result.filter((key) => typeof key === 'string' && patchValue[key] !== null), ...newKeys]),
          ];
        }

        return result;
      },
    });
  }
}

export abstract class ListManager<TItem extends object> extends ListReader<TItem> {
  abstract readonly ItemSchema: Schema<TItem>;

  skipProxy = false;
  patch: ListManagerPatch<TItem> | undefined;

  protected createChunk(chunkName: string, data: ListReaderChunk<TItem>): ListReaderChunk<TItem> {
    return new ListManagerChunkProxy(this, chunkName, data);
  }

  async getAllChunkNames(): Promise<Set<string>> {
    const savedChunkNames = await this.getSavedChunkNames();
    const patchChunkNames = this.getPatchChunkNames();

    return new Set([...savedChunkNames, ...patchChunkNames]);
  }

  async getRemovedEntries(): Promise<ListReaderEntry<TItem>[]> {
    if (!this.patch) {
      return [];
    }
    const ids = Object.getOwnPropertyNames(this.patch).filter((id) => this.patch?.[id] === null);
    this.skipProxy = true;
    const result = await this.getEntries(ids);
    this.skipProxy = false;

    return result.filter((entry): entry is ListReaderEntry<TItem> => typeof entry[1] !== 'undefined');
  }

  getPatchChunkNames(): ReadonlyArray<string> {
    if (!this.patch) {
      return [];
    }

    return [...new Set([...Object.keys(this.patch).map((id) => this.getItemChunkName(id))])];
  }

  /**
   * Returns true if the given value is a valid item according to the ItemSchema,
   * false otherwise.
   */
  isItem(value: unknown): value is TItem {
    return checkSchema(this.ItemSchema, value);
  }

  /**
   * Adds a new item to the list.
   * @throws Error if an item with the given ID already exists.
   * @throws Error if the given reference item ID does not exist.
   * @throws Error if the given item is invalid according to the ItemSchema.
   */
  async addItem(item: TItem | string, id: string): Promise<TItem> {
    let parsedItem = item;

    if (await this.getItem(id)) {
      throw new Error(`Error adding "${id}": item already exists`);
    }

    if (typeof parsedItem === 'string') {
      const refItem = await this.getItem(parsedItem);
      if (!refItem) {
        throw new Error(`Error adding "${id}": reference item "${parsedItem}" was not found`);
      }
      this.mergePatch({ [id]: parsedItem });
      return refItem;
    }

    parsedItem = parseSchema(this.ItemSchema, parsedItem, (message: string) => `Error adding "${id}": ${message}`);

    this.mergePatch({ [id]: parsedItem });

    return parsedItem;
  }

  async mergeItems(id: string, ...withIds: string[]): Promise<TItem> {
    const item = await this.getItem(id);
    if (!item) {
      throw new Error(`Error merging "${id}": item was not found`);
    }

    for (const withId of withIds) {
      const mergedItem = await this.getItem(withId);
      if (!mergedItem) {
        throw new Error(`Error merging "${id}": item "${withId}" was not found`);
      }
      this.mergeItemWith(item, mergedItem);
      this.mergePatch({ [withId]: null });
    }

    return item;
  }

  async mergeItem(item: TItem): Promise<ListReaderEntry<TItem>> {
    const entry = await this.findEntry(item);

    if (!entry) {
      const id = this.createItemId(item);
      if (!id) {
        throw new Error(`Cannot create item ID for ${JSON.stringify(item)}`);
      }

      return [id, await this.addItem(item, id)];
    }

    this.mergeItemWith(entry[1], item);

    return entry;
  }

  /**
   * Removes an item from the list.
   * @throws Error if the item to remove does not exist.
   */
  async removeItem(id: string) {
    if (!(await this.getItem(id))) {
      throw new Error(`Error removing "${id}": item does not exists`);
    }

    if ((await this.getItemStatus(id)) === 'added') {
      this.mergePatch({ [id]: undefined });
    } else {
      this.mergePatch({ [id]: null });
    }
  }

  /**
   * Saves all changes made to the list to the storage.
   * It will only save changes made to the list since the last save.
   * If a chunk does not exist, it will be created.
   * If a chunk exists, it will be overwritten.
   */
  async save() {
    const patchChunkNames = this.getPatchChunkNames();

    for (const chunkName of patchChunkNames) {
      await this.saveChunk(chunkName);
    }

    await this.applyPatch();
  }

  protected createItemId(_item: TItem): string | undefined {
    throw new Error(`Implement ${this.constructor.name}.createItemId method`);
  }

  // protected abstract patchItem(item: TItem, patch: TItemPatch): void;

  protected abstract mergeItemWith(item: TItem, withItem: TItem): void;

  protected async saveChunk(chunkName: string): Promise<void> {
    const data = await this.loadChunk(chunkName);
    const savedChunkNames = await this.getSavedChunkNames();

    // Don't use Object.keys, need to properly implement getOwnPropertyDescriptor for it:
    // https://stackoverflow.com/questions/40352613/why-does-object-keys-and-object-getownpropertynames-produce-different-output
    // https://stackoverflow.com/questions/75148897/get-on-proxy-property-items-is-a-read-only-and-non-configurable-data-proper
    if (Object.getOwnPropertyNames(data).length === 0) {
      savedChunkNames.delete(chunkName);
      return this.removeChunkData(chunkName);
    }

    savedChunkNames.add(chunkName);
    return this.saveChunkData(chunkName, data);
  }

  /**
   * Abstract method to save the chunk data of the list by name. This method must be
   * implemented by subclasses.
   */
  protected abstract saveChunkData(chunkName: string, data: ListReaderChunk<TItem>): Promise<void>;

  /**
   * Abstract method to remove the chunk data. . This method must be
   * implemented by subclasses.
   */
  protected abstract removeChunkData(chunkName: string): Promise<void>;

  /**
   * Returns the number of items in the current patch.
   * If the current patch is `undefined`, returns 0.
   */
  get patchSize() {
    if (!this.patch) {
      return 0;
    }
    return Object.getOwnPropertyNames(this.patch).length;
  }

  /**
   * Merges the given patch into the current patch.
   * If a property in the patch is set to `undefined`, it will be deleted from the current patch.
   * If a property in the patch is an object, it will be merged with the corresponding property in the current patch.
   * If a property in the patch is not an object, it will be set in the current patch.
   * After merging the patch, the cache is cleared.
   */
  mergePatch(patch: ListManagerPatch<TItem>) {
    for (const [id, itemPatch] of Object.entries(patch)) {
      const item = this.patch?.[id];
      if (item && isObject(item) && isObject(itemPatch)) {
        mergeObjects(item, itemPatch);
      } else if (typeof itemPatch === 'undefined') {
        delete this.patch?.[id];
      } else {
        if (!this.patch) {
          this.patch = {};
        }
        this.patch[id] = itemPatch;
      }
    }

    if (this.patch && Object.keys(this.patch).length === 0) {
      this.patch = undefined;
    }

    this.clearCache();
  }

  /**
   * Applies the current patch to the underlying data.
   * This method is usually called when saving the list.
   * It will apply the patch to all chunks, and then clear the patch.
   * If you want to just clear the patch, call `clearPatch()` instead.
   */
  async applyPatch() {
    if (!this.patch) {
      return;
    }

    this.skipProxy = true;

    const patchChunks: Record<string, ListManagerPatch<TItem>> = {};

    for (const [id, itemPatch] of Object.entries(this.patch)) {
      const chunkName = this.getItemChunkName(id);

      patchChunks[chunkName] = { ...patchChunks[chunkName], [id]: itemPatch };
    }

    for (const [chunkName, patch] of Object.entries(patchChunks)) {
      const chunk = await this.loadChunk(chunkName);

      patchObject(chunk, patch as Patch<ListReaderChunk<TItem>>);
    }

    this.skipProxy = false;

    this.clearPatch();
  }

  clearPatch() {
    this.patch = undefined;
    this.clearCache();
  }

  /**
   * Resets the patch for the item with the given ID. If the item was in the patch,
   * it will be removed from the patch. If the item was not in the patch, this
   * method does nothing.
   */
  resetItemPatch(id: string) {
    this.mergePatch({ [id]: undefined });
  }

  getChunkPatch(chunkName: string): ListManagerPatch<TItem> | undefined {
    if (!this.patch) {
      return;
    }

    const entries = Object.entries(this.patch).filter(([id]) => this.getItemChunkName(id) === chunkName);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  /**
   * Returns the status of the item with the given ID.
   * Item status indicates what operation will be performed when the patch is applied.
   * If the item is not in the patch, returns undefined.
   * The possible statuses are:
   * - 'added' if the item will be added
   * - 'changed' if the item will be changed
   * - 'removed' if the item will be removed
   */
  async getItemStatus(id: string): Promise<ListReaderItemStatus | undefined> {
    this.skipProxy = true;
    const entry = await this.getEntry(id);
    this.skipProxy = false;

    if (typeof this.patch?.[id] === 'undefined') {
      return undefined;
    }

    if (this.patch[id] === null) {
      return 'removed';
    }

    if (!entry[1]) {
      return 'added';
    }

    return 'changed';
  }
}

export async function searchListReaderItem<
  TListReader extends ListReader<object>,
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

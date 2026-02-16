import { DeepProxy } from 'proxy-deep';
import type { InferOutput } from 'valibot';
import { null as nullSchema, picklist, record, string, undefined as undefinedSchema, union } from 'valibot';
import { arrayFromAsync, cloneValueWithoutProxy } from '../utils/common-utils.js';
import {
  getObjectValue,
  isObject,
  isPlainObject,
  isProxy,
  mergeObjects,
  setObjectValue,
} from '../utils/object-utils.js';
import { Patch, patchObject } from './patch.js';
import type { ObjectSchema, RecordSchema, Schema } from './schema.js';
import { checkSchema, parseSchema } from './schema.js';

export const LIST_READER_CHUNK_NAME_DEFAULT = 'default';

export const ListReaderItemStatus = picklist(['added', 'changed', 'removed']);

export type ListReaderEntry<TItem> = [id: string, item: TItem, readerName: string, refId?: string];

export type ListReaderChunk<TItem> = Record<string, TItem | string>;

export type ListReaderStats = ReadonlyMap<string, number>;

export type ListReaderItemStatus = InferOutput<typeof ListReaderItemStatus>;

export abstract class ListReader<TItem> {
  abstract readonly name: string;

  protected savedChunkNames: Promise<Set<string>> | undefined;
  protected chunks: Map<string, Promise<ListReaderChunk<TItem>>> = new Map();

  protected cache: Record<string, unknown> = {};

  // Do not use asynchronous code inside `skipProxy = true; ... skipProxy = false;`
  skipProxy = false;

  protected createChunk(_chunkName: string, data: ListReaderChunk<TItem>): ListReaderChunk<TItem> {
    return data;
  }

  protected createCacheSync<T>(key: string, creator: () => T): T {
    if (!this.cache[key]) {
      this.cache[key] = creator();
    }
    return this.cache[key] as T;
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
  async getItemCount(idStartsWith?: string): Promise<number> {
    const chunkNames = await this.getAllChunkNames();
    let count = 0;

    for (const chunkName of chunkNames) {
      const chunk = await this.loadChunk(chunkName);
      const keys = Object.keys(chunk);

      if (idStartsWith) {
        count += keys.filter((id) => id.startsWith(idStartsWith)).length;
      } else {
        count += keys.length;
      }
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
  async getEntry(id: string, skipProxy?: boolean): Promise<ListReaderEntry<TItem | undefined>> {
    const chunkName = this.getItemChunkName(id);
    const allChunkNames = await this.getAllChunkNames();

    if (!allChunkNames.has(chunkName)) {
      return [id, undefined, this.name];
    }

    const chunk = await this.loadChunk(chunkName);

    if (skipProxy) {
      this.skipProxy = true;
    }

    const item = chunk[id];

    if (skipProxy) {
      this.skipProxy = false;
    }

    if (typeof item === 'string') {
      const entry = await this.getEntry(item, skipProxy);

      return [id, entry[1], this.name, entry[3] || item];
    }

    return [id, item, this.name];
  }

  /**
   * Returns an array of all entries in the list with the given IDs. If any of
   * the IDs do not correspond to an item in the list, the returned array will
   * contain an entry with `undefined` as the item value.
   */
  async getEntries(ids: string[], skipProxy?: boolean): Promise<ListReaderEntry<TItem | undefined>[]> {
    return Promise.all(ids.map((id) => this.getEntry(id, skipProxy)));
  }

  /**
   * Returns first entry that fulfills predicate. If no entry found, it returns `undefined`.
   */
  async findEntry(predicate: (value: TItem) => boolean): Promise<ListReaderEntry<TItem> | undefined> {
    for await (const entry of this.yieldAllEntries(true)) {
      if (predicate(entry[1])) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * Returns an array of all entries in the list that fulfill the given predicate.
   */
  async filterEntries(predicate: (value: TItem) => boolean): Promise<Array<ListReaderEntry<TItem>>> {
    const result = [];
    for await (const entry of this.yieldAllEntries(true)) {
      if (predicate(entry[1])) {
        result.push(entry);
      }
    }
    return result;
  }

  readAllEntries = (skipReferences?: boolean) => this.yieldAllEntries(skipReferences);

  readChunkEntries = (chunkName: string, skipReferences?: boolean) => this.yieldChunkEntries(chunkName, skipReferences);

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

    for (const key of Object.keys(chunk)) {
      const value = chunk[key] as TItem | string;
      if (typeof value === 'string') {
        if (!skipReferences) {
          const item = await this.getItem(value);
          if (!item) {
            throw new Error(`Item "${value}" not found`);
          }
          yield [key, item, this.name, value];
        }
      } else {
        yield [key, value, this.name];
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

        if (key === isProxy) {
          return true;
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
      has(target, key) {
        const has = Reflect.has(target, key);
        if (manager.skipProxy) {
          return has;
        }

        const patchValue = getObjectValue(manager.getChunkPatch(chunkName), [...this.path, key.toString()]);
        if (typeof patchValue !== 'undefined' && patchValue !== null) {
          return true;
        }

        return has;
      },
      // https://stackoverflow.com/questions/40352613/why-does-object-keys-and-object-getownpropertynames-produce-different-output
      // https://stackoverflow.com/questions/75148897/get-on-proxy-property-items-is-a-read-only-and-non-configurable-data-proper
      getOwnPropertyDescriptor(target, key) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
        if (manager.skipProxy) {
          return descriptor;
        }

        const patchValue = getObjectValue(manager.getChunkPatch(chunkName), [...this.path, key.toString()]);
        const hasProperty = typeof patchValue !== 'undefined' && patchValue !== null;

        return {
          ...descriptor,
          configurable: descriptor?.configurable ?? hasProperty,
          enumerable: descriptor?.enumerable ?? hasProperty,
        };
      },
    });
  }
}

export abstract class ListManager<TItem extends object> extends ListReader<TItem> {
  abstract readonly ItemSchema: Schema<TItem>;

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
    const ids = Object.keys(this.patch).filter((id) => this.patch?.[id] === null);
    const result = await this.getEntries(ids, true);

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
   * Adds a new item to the list. If the item is a string, it is assumed to be a reference to another item in the list.
   * If `id` is not provided, `createItemId` method will be used to generate an ID for the new item.
   * @throws Error if an item with the given ID already exists.
   * @throws Error if the given reference item ID does not exist.
   * @throws Error if the given item is invalid according to the ItemSchema.
   */
  async addItem(item: TItem, id?: string): Promise<ListReaderEntry<TItem>>;
  async addItem(item: string, id: string): Promise<ListReaderEntry<TItem>>;
  async addItem(item: TItem | string, id?: string): Promise<ListReaderEntry<TItem>> {
    let addedId = id;
    let addedItem = item;

    if (addedId) {
      if (await this.getItem(addedId)) {
        throw new Error(`Error adding "${addedId}": item already exists`);
      }
    } else if (typeof addedItem !== 'string') {
      addedId = await this.createItemId(addedItem);
    }

    if (!addedId) {
      throw new Error(`Error adding item: missing item ID`);
    }

    if (typeof addedItem === 'string') {
      const refItem = await this.getItem(addedItem);
      if (!refItem) {
        throw new Error(`Error adding "${id}": reference item "${addedItem}" was not found`);
      }
      this.mergePatch({ [addedId]: addedItem });
      return [addedId, refItem, this.name];
    }

    addedItem = parseSchema(this.ItemSchema, addedItem, (message: string) => `Error adding "${id}": ${message}`);

    this.mergePatch({ [addedId]: addedItem });

    return [addedId, addedItem, this.name];
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
   */
  async save() {
    // Get patch chunk names BEFORE clearing patch
    const patchChunkNames = this.getPatchChunkNames();

    // TODO: apply and clear patch AFTER successful save

    // Apply patch to make YAML dump work properly.
    // It's using Object.keys which is currently not supported by ListManagerChunkProxy.
    await this.applyPatch();

    // Clear patch to avoid "Maximum call stack size exceeded" error
    // TODO: fix this by saving deep proxy to patch as deep plain object
    // Example: item.posts = [...(item.posts ?? []), ...[{ service: 'tg', id: 1, published: new Date() }]]
    this.clearPatch();

    for (const chunkName of patchChunkNames) {
      await this.saveChunk(chunkName);
    }
  }

  /**
   * Creates a unique ID for the given item in the list.
   * Must be implemented by the child class to use `addItem` method without `id` argument.
   */
  async createItemId(_item: TItem): Promise<string> {
    throw new Error(`Implement ${this.constructor.name}.createItemId method`);
  }

  protected abstract mergeItemWith(item: TItem, withItem: TItem): void;

  /**
   * Saves a chunk of the list by name.
   * If a chunk does not exist, it will be created.
   * If a chunk exists, it will be overwritten.
   */
  protected async saveChunk(chunkName: string): Promise<void> {
    const data = await this.loadChunk(chunkName);
    const savedChunkNames = await this.getSavedChunkNames();

    if (Object.keys(data).length === 0) {
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
    return Object.keys(this.patch).length;
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
      // Ensure the value does not include Proxy objects
      const clonedItemPatch = cloneValueWithoutProxy(itemPatch);

      if (item && isObject(item) && isObject(clonedItemPatch)) {
        mergeObjects(item, clonedItemPatch);
      } else if (typeof clonedItemPatch === 'undefined') {
        delete this.patch?.[id];
      } else {
        if (!this.patch) {
          this.patch = {};
        }
        this.patch[id] = clonedItemPatch;
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

    const patchChunks: Record<string, ListManagerPatch<TItem>> = {};

    for (const [id, itemPatch] of Object.entries(this.patch)) {
      const chunkName = this.getItemChunkName(id);

      patchChunks[chunkName] = { ...patchChunks[chunkName], [id]: itemPatch };
    }

    for (const [chunkName, patch] of Object.entries(patchChunks)) {
      const chunk = await this.loadChunk(chunkName);

      this.skipProxy = true;
      patchObject(chunk, patch as Patch<ListReaderChunk<TItem>>);
      this.skipProxy = false;
    }
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
    return this.createCacheSync(`${this.getChunkPatch.name}.${chunkName}`, () => {
      if (!this.patch) {
        return;
      }

      const entries = Object.entries(this.patch).filter(([id]) => this.getItemChunkName(id) === chunkName);
      return entries.length > 0 ? Object.fromEntries(entries) : undefined;
    });
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
    const entry = await this.getEntry(id, true);

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

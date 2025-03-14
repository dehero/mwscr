import type { IFs } from 'memfs';
import { memfs } from 'memfs';
import assert from 'node:assert';
import test, { afterEach } from 'node:test';
import { test2016ShotSkar, test2024WallpaperSuran, test2025ReferencedPostId } from '../../test-data/posts.js';
import { jsonDateReviver } from '../utils/date-utils.js';
import type { ListReaderChunk } from './list-manager.js';
import { ListManager } from './list-manager.js';
import { mergePostWith, Post } from './post.js';
import type { Schema } from './schema.js';

const initialData = {
  '2024.json': JSON.stringify(Object.fromEntries([test2024WallpaperSuran])),
  '2025.json': JSON.stringify(Object.fromEntries([[test2025ReferencedPostId, test2024WallpaperSuran[0]]])),
};

class TestListManager extends ListManager<Post> {
  readonly fs: IFs['promises'];

  readonly name = 'test';
  readonly ItemSchema: Schema<Post> = Post;

  protected mergeItemWith = mergePostWith;

  protected getItemChunkName = (id: string) => {
    const chunkName = id.split('-')[0];

    if (!chunkName) {
      throw new Error(`Cannot get chunk name from item "${id}"`);
    }
    return chunkName;
  };

  constructor() {
    super();
    const { fs, vol } = memfs();
    vol.fromJSON(initialData);
    this.fs = fs.promises;
  }

  protected async loadChunkNames(): Promise<string[]> {
    const files = await this.fs.readdir('./');

    return files
      .map((file) => (typeof file === 'string' ? /^(.*)\.json$/.exec(file)?.[1] : undefined))
      .filter((name): name is string => typeof name === 'string');
  }

  protected async removeChunkData(chunkName: string): Promise<void> {
    return this.fs.unlink(`${chunkName}.json`);
  }

  protected async saveChunkData(chunkName: string, data: ListReaderChunk<Post>) {
    const fileName = `${chunkName}.json`;

    return this.fs.writeFile(fileName, JSON.stringify(data), { encoding: 'utf8' });
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `${chunkName}.json`;
    const data = await this.fs.readFile(filename, 'utf8');

    return JSON.parse(data.toString(), jsonDateReviver);
  }
}

test('ListManagerChunkProxy', async (t) => {
  const manager = new TestListManager();
  const changedId = test2024WallpaperSuran[0];

  afterEach(() => {
    manager.clearPatch();
  });

  await t.test('should change item', async () => {
    let item = await manager.getItem(changedId);
    assert.ok(item);

    item.description = 'Changed Description';

    item = await manager.getItem(changedId);

    assert.strictEqual(item?.description, 'Changed Description');
  });

  await t.test('should change detached objects in arrays', async () => {
    const item = await manager.getItem(changedId);

    const publication = item?.posts?.[1];
    assert.ok(publication);

    publication.likes = 666;

    assert.strictEqual(item.posts?.[1]?.likes, 666);
  });

  await t.test('should patch referenced item', async () => {
    const [, item, refId] = await manager.getEntry(test2025ReferencedPostId);

    assert.ok(item && refId);

    item.title = 'New Title';

    assert.deepStrictEqual(manager.patch, { [refId]: { title: 'New Title' } });
  });
});

test('ListManager.addItem', async (t) => {
  const manager = new TestListManager();
  const [addedId, addedItem] = test2016ShotSkar;

  afterEach(() => {
    manager.clearPatch();
  });

  await t.test('should keep added item', async () => {
    await manager.addItem(addedItem, addedId);

    assert.deepStrictEqual(await manager.getItem(addedId), addedItem);
  });

  await t.test('should store unsaved added item in patch', async () => {
    await manager.addItem(addedItem, addedId);

    assert.deepStrictEqual(manager.patch, { [addedId]: addedItem });
  });

  await t.test('should increase item count after adding item', async () => {
    const oldItemCount = await manager.getItemCount();
    await manager.addItem(addedItem, addedId);

    assert.strictEqual(await manager.getItemCount(), oldItemCount + 1);
  });

  await t.test('should throw an error if the item ID already exists', async () => {
    const manager = new TestListManager();
    const [id, post] = test2024WallpaperSuran;

    await assert.rejects(manager.addItem(post, id), new Error(`Error adding "${id}": item already exists`));
  });

  await t.test('should throw an error if reference item ID is not found', async () => {
    const refId = '2016-10-31-reference-post';

    await assert.rejects(
      manager.addItem(refId, addedId),
      new Error(`Error adding "${addedId}": reference item "${refId}" was not found`),
    );
  });

  await t.test('should throw an error if added item is not valid', async () => {
    await assert.rejects(
      manager.addItem({ caption: 'Some Caption', likes: 12 } as unknown as Post, addedId),
      new Error(`Error adding "${addedId}": missing type`),
    );
  });

  await t.test('should save arrays inside added item in patch as is', async () => {
    const [, item] = await manager.addItem(addedItem, addedId);

    item.posts?.push({ service: 'tg', id: 9999, published: new Date() });

    const itemPatch = manager.patch?.[addedId];

    assert.ok(typeof itemPatch !== 'string' && Array.isArray(itemPatch?.posts));
  });

  await t.test('should create chunk name for added item', async () => {
    await manager.addItem(addedItem, addedId);

    assert.deepStrictEqual(await manager.getAllChunkNames(), new Set(['2024', '2025', '2016']));
  });

  await t.test("should create item from another item and keep it's changes", async () => {
    const [existingId, existingItem] = await manager.getEntry(test2024WallpaperSuran[0]);

    assert.ok(existingItem);

    const newId = `${existingId}-new`;
    existingItem.description = 'Changed Description';

    await manager.addItem(existingItem, newId);
    const newItem = await manager.getItem(newId);

    assert.strictEqual(newItem?.description, 'Changed Description');
  });
});

test('ListManager.removeItem', async (t) => {
  const manager = new TestListManager();
  const [addedId, addedItem] = test2016ShotSkar;
  const removedId = test2024WallpaperSuran[0];

  afterEach(() => {
    manager.clearPatch();
  });

  await t.test('should remove item', async () => {
    await manager.removeItem(removedId);

    assert.strictEqual(await manager.getItem(removedId), undefined);
  });

  await t.test('should save removed item to patch as null', async () => {
    await manager.removeItem(removedId);

    assert.deepStrictEqual(manager.patch, { [removedId]: null });
  });

  await t.test('should decrease item count after removing item', async () => {
    const oldItemCount = await manager.getItemCount();
    await manager.removeItem(removedId);

    assert.strictEqual(await manager.getItemCount(), oldItemCount - 1);
  });

  await t.test('should throw an error if removed item does not exist', async () => {
    const id = '2014-06-17-does-not-exist';

    await assert.rejects(manager.removeItem(id), new Error(`Error removing "${id}": item does not exists`));
  });

  await t.test('should leave chunk empty after removing item', async () => {
    await manager.removeItem(removedId);

    assert.strictEqual((await manager.getChunkEntries('2024')).length, 0);
  });

  await t.test('should not remove chunk name for removed item when chunk becomes empty', async () => {
    await manager.removeItem(removedId);

    assert.deepStrictEqual(await manager.getAllChunkNames(), new Set(['2024', '2025']));
  });

  await t.test('should keep patch empty after item was added, then removed', async () => {
    await manager.addItem(addedItem, addedId);
    await manager.removeItem(addedId);

    assert.strictEqual(manager.patch, undefined);
  });
});

test('ListManager.getItemStatus', async (t) => {
  const manager = new TestListManager();
  const [addedId, addedItem] = test2016ShotSkar;
  const existingId = test2024WallpaperSuran[0];

  afterEach(() => {
    manager.clearPatch();
  });

  await t.test('should return undefined for existing item', async () => {
    assert.strictEqual(await manager.getItemStatus(existingId), undefined);
  });

  await t.test('should return undefined for item that does not exist', async () => {
    assert.strictEqual(await manager.getItemStatus('2014-06-17-does-not-exist'), undefined);
  });

  await t.test('should return "added" for added item', async () => {
    await manager.addItem(addedItem, addedId);

    assert.strictEqual(await manager.getItemStatus(addedId), 'added');
  });

  await t.test('should return "changed" for changed item', async () => {
    const item = await manager.getItem(existingId);
    assert.ok(item);

    item.title = 'Changed Title';

    assert.strictEqual(await manager.getItemStatus(existingId), 'changed');
  });

  await t.test('should return "removed" for removed item', async () => {
    await manager.removeItem(existingId);

    assert.strictEqual(await manager.getItemStatus(existingId), 'removed');
  });
});

test('ListManager.save', async (t) => {
  const [addedId, addedItem] = test2016ShotSkar;
  const changedId = test2024WallpaperSuran[0];
  const removedId = test2024WallpaperSuran[0];

  await t.test('should save added item to new chunk', async () => {
    const manager = new TestListManager();

    await manager.addItem(addedItem, addedId);
    await manager.save();

    const data = await manager.fs.readFile('./2016.json', 'utf8');
    assert.ok(typeof data === 'string');
    const chunk = JSON.parse(data, jsonDateReviver);

    assert.deepStrictEqual(chunk, { [addedId]: addedItem });
  });

  await t.test('should save changes to existing chunk', async () => {
    const manager = new TestListManager();

    const changedItem = await manager.getItem(changedId);
    const publication = changedItem?.posts?.[1];
    assert.ok(publication);

    publication.likes = 666;
    await manager.save();

    const data = await manager.fs.readFile('./2024.json', 'utf8');
    assert.ok(typeof data === 'string');
    const chunk = JSON.parse(data, jsonDateReviver);

    assert.strictEqual(chunk[changedId]?.posts?.[1].likes, 666);
  });

  await t.test('should remove existing chunk that becomes empty', async () => {
    const manager = new TestListManager();

    await manager.removeItem(removedId);
    await manager.save();

    await assert.rejects(
      () => manager.fs.readFile('./2024.json', 'utf8'),
      new Error("ENOENT: no such file or directory, open './2024.json'"),
    );
  });

  await t.test('should clear patch after save', async () => {
    const manager = new TestListManager();

    await manager.addItem(addedItem, addedId);
    await manager.removeItem(removedId);
    await manager.save();

    assert.strictEqual(manager.patch, undefined);
  });

  await t.test('should keed added items after save', async () => {
    const manager = new TestListManager();

    await manager.addItem(addedItem, addedId);
    await manager.save();

    assert.deepStrictEqual(await manager.getItem(addedId), addedItem);
  });

  await t.test('should keep item changes after save', async () => {
    const manager = new TestListManager();

    let changedItem = await manager.getItem(changedId);
    assert.ok(changedItem);

    changedItem.title = 'Changed Title';
    await manager.save();

    changedItem = await manager.getItem(changedId);

    assert.strictEqual(changedItem?.title, 'Changed Title');
  });

  await t.test('should not keep removed items after save', async () => {
    const manager = new TestListManager();

    await manager.removeItem(removedId);
    await manager.save();

    assert.strictEqual(await manager.getItem(removedId), undefined);
  });
});

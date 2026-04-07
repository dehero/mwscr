/* eslint-disable sonarjs/no-duplicate-string */
import assert from 'node:assert';
import { test } from 'node:test';
import { stringToDate } from '../utils/date-utils.js';
import {
  createStoreItemUrl,
  parseStoreItemUrl,
  STORE_DRAWINGS_DIR,
  STORE_INBOX_DIR,
  STORE_NEWS_DIR,
  STORE_ORIGINAL_DIR,
  STORE_OUTTAKES_DIR,
  STORE_PHOTOS_DIR,
  STORE_PHOTOSHOPS_DIR,
  STORE_SHOTS_DIR,
  STORE_SNAPSHOTS_DIR,
  STORE_TRASH_DIR,
  STORE_VIDEOS_DIR,
  STORE_WALLPAPERS_DIR,
  storeIncludesPath,
} from './store.js';

test('storeIncludesPath', async (t) => {
  const paths = ['shots/2016-11-20.1.dren-plantation.png', 'drawings/2019-05-08.an-old-bridge.png'];

  await t.test('should return true if store.include is undefined', () => {
    const store = { include: undefined };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, true);
  });

  await t.test('should return true if all paths match the include pattern', () => {
    const store = { include: ['shots/*.png', 'drawings/*.png'] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, true);
  });

  await t.test('should return false if any path does not match the include pattern', () => {
    const store = { include: ['inbox/*.*'] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, false);
  });

  await t.test('should return false if store.include is defined and empty', () => {
    const store = { include: [] };

    const result = storeIncludesPath(...paths)(store);
    assert.strictEqual(result, false);
  });
});

test('parseStoreItemUrl', async (t) => {
  await t.test('should parse inbox draft item with original variant', () => {
    const url = 'store:/inbox/john.2024-01-15-draft-post.png';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: stringToDate('2024-01-15'),
      key: 'draft-post',
      variant: 'original',
      ext: '.png',
    });
  });

  await t.test('should parse inbox draft item with numeric variant', () => {
    const url = 'store:/inbox/john.2024-01-15-draft-post.2.png';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: stringToDate('2024-01-15'),
      key: 'draft-post',
      variant: 2,
      ext: '.png',
    });
  });

  await t.test('should parse trash draft item', () => {
    const url = 'store:/trash/jane.2023-12-10-deleted-item.jpg';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_TRASH_DIR,
      author: 'jane',
      date: stringToDate('2023-12-10'),
      key: 'deleted-item',
      variant: 'original',
      ext: '.jpg',
    });
  });

  await t.test('should parse shots final item', () => {
    const url = 'store:/shots/2024-02-20-beautiful-shot.jpg';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: stringToDate('2024-02-20'),
      key: 'beautiful-shot',
      variant: 'final',
      ext: '.jpg',
    });
  });

  await t.test('should parse shots original item', () => {
    const url = 'store:/shots/original/2024-02-20-beautiful-shot.original.png';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: stringToDate('2024-02-20'),
      key: 'beautiful-shot',
      variant: 'original',
      ext: '.png',
    });
  });

  await t.test('should parse videos final item', () => {
    const url = 'store:/videos/2024-03-01-cool-video.mp4';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_VIDEOS_DIR,
      author: undefined,
      date: stringToDate('2024-03-01'),
      key: 'cool-video',
      variant: 'final',
      ext: '.mp4',
    });
  });

  await t.test('should parse drawings final item', () => {
    const url = 'store:/drawings/2024-01-05-artwork.webp';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_DRAWINGS_DIR,
      author: undefined,
      date: stringToDate('2024-01-05'),
      key: 'artwork',
      variant: 'final',
      ext: '.webp',
    });
  });

  await t.test('should parse news final item', () => {
    const url = 'store:/news/2024-04-10-announcement.pdf';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_NEWS_DIR,
      author: undefined,
      date: stringToDate('2024-04-10'),
      key: 'announcement',
      variant: 'final',
      ext: '.pdf',
    });
  });

  await t.test('should parse outtakes final item', () => {
    const url = 'store:/outtakes/2023-11-30-funny-moment.gif';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_OUTTAKES_DIR,
      author: undefined,
      date: stringToDate('2023-11-30'),
      key: 'funny-moment',
      variant: 'final',
      ext: '.gif',
    });
  });

  await t.test('should parse photoshops final item', () => {
    const url = 'store:/photoshops/2024-02-14-edited-image.psd';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_PHOTOSHOPS_DIR,
      author: undefined,
      date: stringToDate('2024-02-14'),
      key: 'edited-image',
      variant: 'final',
      ext: '.psd',
    });
  });

  await t.test('should parse wallpapers final item', () => {
    const url = 'store:/wallpapers/2024-03-15-desktop-wallpaper.jpg';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_WALLPAPERS_DIR,
      author: undefined,
      date: stringToDate('2024-03-15'),
      key: 'desktop-wallpaper',
      variant: 'final',
      ext: '.jpg',
    });
  });

  await t.test('should parse snapshots final item', () => {
    const url = 'store:/snapshots/2024-01-20-screenshot.png';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_SNAPSHOTS_DIR,
      author: undefined,
      date: stringToDate('2024-01-20'),
      key: 'screenshot',
      variant: 'final',
      ext: '.png',
    });
  });

  await t.test('should parse photos final item', () => {
    const url = 'store:/photos/2024-05-01-family-photo.jpg';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: STORE_PHOTOS_DIR,
      author: undefined,
      date: stringToDate('2024-05-01'),
      key: 'family-photo',
      variant: 'final',
      ext: '.jpg',
    });
  });

  await t.test('should parse custom directory item', () => {
    const url = 'store:/custom/config.json';
    const result = parseStoreItemUrl(url);

    assert.deepStrictEqual(result, {
      dir: 'custom',
      author: undefined,
      date: undefined,
      key: 'config',
      variant: 'final',
      ext: '.json',
    });
  });

  await t.test('should return undefined for non-store protocol', () => {
    const url = 'https://example.com/file.jpg';
    const result = parseStoreItemUrl(url);

    assert.strictEqual(result, undefined);
  });

  await t.test('should return undefined for invalid inbox format', () => {
    const url = 'store:/inbox/invalid-format.png';
    const result = parseStoreItemUrl(url);

    assert.strictEqual(result, undefined);
  });

  await t.test('should return undefined for invalid final format', () => {
    const url = 'store:/shots/invalid-format.png';
    const result = parseStoreItemUrl(url);

    assert.strictEqual(result, undefined);
  });
});

test('createStoreItemUrl', async (t) => {
  const testDate = stringToDate('2024-01-15');

  await t.test('should create inbox draft item URL with original variant', () => {
    const components = {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: testDate,
      key: 'draft-post',
      variant: 'original' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/inbox/john.2024-01-15-draft-post.png');
  });

  await t.test('should create inbox draft item URL with numeric variant', () => {
    const components = {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: testDate,
      key: 'draft-post',
      variant: 2 as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/inbox/john.2024-01-15-draft-post.2.png');
  });

  await t.test('should create trash draft item URL', () => {
    const components = {
      dir: STORE_TRASH_DIR,
      author: 'jane',
      date: testDate,
      key: 'deleted-item',
      variant: 'original' as const,
      ext: '.jpg',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/trash/jane.2024-01-15-deleted-item.jpg');
  });

  await t.test('should return undefined for inbox with final variant', () => {
    const components = {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: testDate,
      key: 'draft-post',
      variant: 'final' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, undefined);
  });

  await t.test('should return undefined for inbox without date', () => {
    const components = {
      dir: STORE_INBOX_DIR,
      author: 'john',
      date: undefined,
      key: 'draft-post',
      variant: 'original' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, undefined);
  });

  await t.test('should create shots final item URL', () => {
    const components = {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: testDate,
      key: 'beautiful-shot',
      variant: 'final' as const,
      ext: '.jpg',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/shots/2024-01-15-beautiful-shot.jpg');
  });

  await t.test('should create shots original item URL', () => {
    const components = {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: testDate,
      key: 'beautiful-shot',
      variant: 'original' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, `store:/shots/${STORE_ORIGINAL_DIR}/2024-01-15-beautiful-shot.original.png`);
  });

  await t.test('should create videos final item URL', () => {
    const components = {
      dir: STORE_VIDEOS_DIR,
      author: undefined,
      date: testDate,
      key: 'cool-video',
      variant: 'final' as const,
      ext: '.mp4',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/videos/2024-01-15-cool-video.mp4');
  });

  await t.test('should create drawings final item URL', () => {
    const components = {
      dir: STORE_DRAWINGS_DIR,
      author: undefined,
      date: testDate,
      key: 'artwork',
      variant: 'final' as const,
      ext: '.webp',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/drawings/2024-01-15-artwork.webp');
  });

  await t.test('should create news final item URL', () => {
    const components = {
      dir: STORE_NEWS_DIR,
      author: undefined,
      date: testDate,
      key: 'announcement',
      variant: 'final' as const,
      ext: '.pdf',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/news/2024-01-15-announcement.pdf');
  });

  await t.test('should create outtakes final item URL', () => {
    const components = {
      dir: STORE_OUTTAKES_DIR,
      author: undefined,
      date: testDate,
      key: 'funny-moment',
      variant: 'final' as const,
      ext: '.gif',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/outtakes/2024-01-15-funny-moment.gif');
  });

  await t.test('should create photoshops final item URL', () => {
    const components = {
      dir: STORE_PHOTOSHOPS_DIR,
      author: undefined,
      date: testDate,
      key: 'edited-image',
      variant: 'final' as const,
      ext: '.psd',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/photoshops/2024-01-15-edited-image.psd');
  });

  await t.test('should create wallpapers final item URL', () => {
    const components = {
      dir: STORE_WALLPAPERS_DIR,
      author: undefined,
      date: testDate,
      key: 'desktop-wallpaper',
      variant: 'final' as const,
      ext: '.jpg',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/wallpapers/2024-01-15-desktop-wallpaper.jpg');
  });

  await t.test('should create snapshots final item URL', () => {
    const components = {
      dir: STORE_SNAPSHOTS_DIR,
      author: undefined,
      date: testDate,
      key: 'screenshot',
      variant: 'final' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/snapshots/2024-01-15-screenshot.png');
  });

  await t.test('should create photos final item URL', () => {
    const components = {
      dir: STORE_PHOTOS_DIR,
      author: undefined,
      date: testDate,
      key: 'family-photo',
      variant: 'final' as const,
      ext: '.jpg',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/photos/2024-01-15-family-photo.jpg');
  });

  await t.test('should return undefined for final variant without date', () => {
    const components = {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: undefined,
      key: 'beautiful-shot',
      variant: 'final' as const,
      ext: '.jpg',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, undefined);
  });

  await t.test('should return undefined for original variant without date', () => {
    const components = {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: undefined,
      key: 'beautiful-shot',
      variant: 'original' as const,
      ext: '.png',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, undefined);
  });

  await t.test('should create custom directory URL', () => {
    const components = {
      dir: 'custom',
      author: undefined,
      date: undefined,
      key: 'config',
      variant: 'final' as const,
      ext: '.json',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/custom/config.json');
  });

  await t.test('should handle empty extension', () => {
    const components = {
      dir: STORE_SHOTS_DIR,
      author: undefined,
      date: testDate,
      key: 'no-extension',
      variant: 'final' as const,
      ext: '',
    };

    const result = createStoreItemUrl(components);
    assert.strictEqual(result, 'store:/shots/2024-01-15-no-extension');
  });
});

test('parseStoreItemUrl and createStoreItemUrl should be reversible', async (t) => {
  const testCases = [
    'store:/inbox/john.2024-01-15-draft-post.png',
    'store:/inbox/john.2024-01-15-draft-post.2.png',
    'store:/trash/jane.2023-12-10-deleted-item.jpg',
    'store:/shots/2024-02-20-beautiful-shot.jpg',
    'store:/shots/original/2024-02-20-beautiful-shot.original.png',
    'store:/videos/2024-03-01-cool-video.mp4',
    'store:/drawings/2024-01-05-artwork.webp',
    'store:/news/2024-04-10-announcement.pdf',
    'store:/outtakes/2023-11-30-funny-moment.gif',
    'store:/photoshops/2024-02-14-edited-image.psd',
    'store:/wallpapers/2024-03-15-desktop-wallpaper.jpg',
    'store:/snapshots/2024-01-20-screenshot.png',
    'store:/photos/2024-05-01-family-photo.jpg',
    'store:/custom/config.json',
  ];

  for (const url of testCases) {
    await t.test(`should be reversible for ${url}`, () => {
      const parsed = parseStoreItemUrl(url);
      assert.ok(parsed, `Failed to parse ${url}`);

      const recreated = createStoreItemUrl(parsed);
      assert.strictEqual(recreated, url, `Failed to recreate ${url}`);
    });
  }
});

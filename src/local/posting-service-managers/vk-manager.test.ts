import assert from 'node:assert';
import { afterEach, mock, test } from 'node:test';
import { test2016ShotSkar, test2024WallpaperSuran, test2025RedrawingMzahnch } from '../../test-data/posts.js';
import { vkManager } from './vk-manager.js';

afterEach(() => {
  mock.timers.reset();
});

test('createCaption', async (t) => {
  await t.test('should create proper post caption on Russian', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2024-08-07T18:25:22Z') });

    const caption = await vkManager.createCaption(test2016ShotSkar);

    assert.strictEqual(
      caption,
      "Альд'рун, под Скаром\nот someone\n#morrowind #elderscrolls #screenshot #openmw #sometag #anothertag\n\nАльд'рун, Район поместий\n20.11.2016\nПосмотреть и скачать: https://mwscr.dehero.site/posts/2016-11-20-ald-ruhn-under-skar/",
    );
  });

  await t.test('should create proper post caption on Russian for wallpaper', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2024-08-07T18:25:22Z') });

    const caption = await vkManager.createCaption(test2024WallpaperSuran);

    assert.strictEqual(
      caption,
      'Вертикальные обои: Звезды над Сураном\nот someone\n#morrowind #elderscrolls #wallpaper #openmw #sometag #anothertag\n\nСуран\nПосмотреть и скачать: https://mwscr.dehero.site/posts/2024-08-07-stars-above-suran/',
    );
  });

  await t.test('should create proper post caption on Russian for redrawing', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2025-01-04T18:25:22Z') });

    const caption = await vkManager.createCaption(test2025RedrawingMzahnch);

    assert.strictEqual(
      caption,
      'Перерисовка: Мзанч\nот @club207258733 (Ирины Быстрицкой)\n#morrowind #elderscrolls #drawing #screenshot #openmw #dwemer #ruin\n\nПосмотреть и скачать: https://mwscr.dehero.site/posts/2025-01-04-mzahnch/',
    );
  });
});

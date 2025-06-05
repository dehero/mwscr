import assert from 'node:assert';
import { afterEach, mock, test } from 'node:test';
import {
  test2016ShotSkar,
  test2024WallpaperSuran,
  test2025NewsInterview,
  test2025OuttakesCaves,
  test2025RedrawingMzahnch,
} from '../../test-data/posts.js';
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
      "Альд'рун, под Скаром\nот someone\n\nАльд'рун, Район поместий\n20.11.2016\nПодробности: https://mwscr.dehero.site/posts/2016-11-20-ald-ruhn-under-skar/\n\n#morrowind #elderscrolls #screenshot #openmw #sometag #anothertag",
    );
  });

  await t.test('should create proper post caption on Russian for wallpaper', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2024-08-07T18:25:22Z') });

    const caption = await vkManager.createCaption(test2024WallpaperSuran);

    assert.strictEqual(
      caption,
      'Вертикальные обои: Звезды над Сураном\nот someone\n\nСуран\nПодробности: https://mwscr.dehero.site/posts/2024-08-07-stars-above-suran/\n\n#morrowind #elderscrolls #wallpaper #openmw #sometag #anothertag',
    );
  });

  await t.test('should create proper post caption on Russian for redrawing', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2025-01-04T18:25:22Z') });

    const caption = await vkManager.createCaption(test2025RedrawingMzahnch);

    assert.strictEqual(
      caption,
      'Перерисовка: Мзанч\nот @club207258733 (Ирины Быстрицкой)\n\nПодробности: https://mwscr.dehero.site/extras/2025-01-04-mzahnch/\n\n#morrowind #elderscrolls #drawing #screenshot #openmw #dwemer #ruin',
    );
  });

  await t.test('should create proper post caption on Russian for outtakes', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2025-01-04T18:25:22Z') });

    const caption = await vkManager.createCaption(test2025OuttakesCaves);

    assert.strictEqual(
      caption,
      'Невошедшее: Пещеры\n\nПодробности: https://mwscr.dehero.site/extras/2025-05-15-caves/\n\n#morrowind #elderscrolls #openmw #cave',
    );
  });

  await t.test('should create proper post caption on Russian for news', async () => {
    mock.timers.enable({ apis: ['Date'], now: new Date('2025-01-04T18:25:22Z') });

    const caption = await vkManager.createCaption(test2025NewsInterview);

    assert.strictEqual(
      caption,
      'Дорогие подписчики! Делюсь с вами интервью, взятым у меня игровым блогером Дмитрием Епихиным. Оно полностью посвящено рассказу о проекте Morrowind Screenshots и о Morrowind в целом. Приятного чтения!\n\nDTF (Русский): https://dtf.ru/screenshots/3312760-fotografiruyu-morrowind-uzhe-15-let-intervyu-s-osnovatelem-proekta-morrowind-screenshots\nStopGame (Русский): https://stopgame.ru/blogs/topic/117167/fotografiruyu_morrowind_uzhe_15_let_interview_s_osnovatelem_proekta_morrowind_screenshots\nMedium (Английский): https://medium.com/@dmepikh/ive-been-photographing-morrowind-for-15-years-interview-with-the-founder-of-the-morrowind-a5ee65712217\n\nПодробности: https://mwscr.dehero.site/extras/2025-05-15-interview/',
    );
  });
});

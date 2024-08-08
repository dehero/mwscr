import assert from 'node:assert';
import { test } from 'node:test';
import type { PostEntry } from '../../core/entities/post.js';
import { vkManager } from './vk-manager.js';

test('createCaption', async (t) => {
  const shotEntry: PostEntry = [
    '2016-11-20-ald-ruhn-under-skar',
    {
      title: "Ald'ruhn, Under-Skar",
      titleRu: "Альд'рун, под Скаром",
      location: 'Ald-ruhn, Manor District',
      type: 'shot',
      author: 'someone',
      engine: 'OpenMW',
      tags: ['sometag', 'anothertag'],
      posts: [
        {
          service: 'ig',
          id: 'BNCoHm0l691',
          mediaId: '17857319095079064',
          published: new Date('2016-11-20T00:00:00.000Z'),
        },
        {
          service: 'vk',
          id: 6,
          published: new Date('2017-01-22T00:00:00.000Z'),
        },
      ],
    },
  ];

  const wallpaperEntry: PostEntry = [
    '2024-08-07-stars-above-suran',
    {
      title: 'Stars Above Suran',
      titleRu: 'Звезды над Сураном',
      location: 'Suran',
      type: 'wallpaper-v',
      author: 'someone',
      engine: 'OpenMW',
      tags: ['sometag', 'anothertag'],
      posts: [
        {
          service: 'ig',
          id: 'BNCoHm0l691',
          mediaId: '17857319095079064',
          published: new Date('2024-08-07T00:00:00.000Z'),
        },
        {
          service: 'vk',
          id: 6,
          published: new Date('2024-08-07T00:00:00.000Z'),
        },
      ],
    },
  ];

  await t.test('should create proper post caption on Russian', async () => {
    const caption = await vkManager.createCaption(shotEntry);

    assert.strictEqual(
      caption,
      "Альд'рун, под Скаром\nот someone\n#morrowind #elderscrolls #screenshot #openmw #sometag #anothertag\n\nАльд'рун, Район поместий\n20.11.2016\nПосмотреть и скачать: https://mwscr.dehero.site/posts/2016-11-20-ald-ruhn-under-skar/",
    );
  });

  await t.test('should create proper post caption on Russian for wallpaper', async () => {
    const caption = await vkManager.createCaption(wallpaperEntry);

    assert.strictEqual(
      caption,
      'Вертикальные обои: Звезды над Сураном\nот someone\n#morrowind #elderscrolls #wallpaper #openmw #sometag #anothertag\n\nСуран\nПосмотреть и скачать: https://mwscr.dehero.site/posts/2024-08-07-stars-above-suran/',
    );
  });
});

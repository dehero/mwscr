import type { PostEntry } from '../core/entities/post.js';

export const test2016ShotSkar: PostEntry = [
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

export const test2024WallpaperSuran: PostEntry = [
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

export const test2025ReferencedPostId = '2025-01-01-reference-post';

export const test2025RedrawingMzahnch: PostEntry = [
  '2025-01-04-mzahnch',
  {
    title: 'Mzahnch',
    titleRu: 'Мзанч',
    location: 'Mzahnch',
    type: 'redrawing',
    author: ['irina-bystritskaya', 'dehero'],
    engine: 'OpenMW',
    tags: ['dwemer', 'ruin'],
  },
];

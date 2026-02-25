import type { PostEntry } from '../core/entities/post.js';

export const test2016ShotSkar: PostEntry = [
  '2016-11-20-ald-ruhn-under-skar',
  {
    title: "Ald'ruhn, Under-Skar",
    titleRu: "Альд'рун, под Скаром",
    location: 'Ald-ruhn, Manor District',
    type: 'shot',
    aspect: '1/1',
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
  'posts',
];

export const test2024WallpaperSuran: PostEntry = [
  '2024-08-07-stars-above-suran',
  {
    title: 'Stars Above Suran',
    titleRu: 'Звезды над Сураном',
    location: 'Suran',
    type: 'wallpaper',
    aspect: '9/19.5',
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
  'posts',
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
  'extras',
];

export const test2025OuttakesCaves: PostEntry = [
  '2025-05-15-caves',
  {
    title: 'Caves',
    titleRu: 'Пещеры',
    type: 'outtakes',
    author: 'dehero',
    engine: 'OpenMW',
    tags: ['cave'],
  },
  'extras',
];

export const test2025NewsInterview: PostEntry = [
  '2025-05-15-interview',
  {
    title: 'Interview to Dmitry Epikhin',
    titleRu: 'Интервью Дмитрию Епихину',
    description:
      'Dear followers! I would like to share with you an interview conducted by game blogger Dmitry Epikhin. It is entirely\ndedicated to the story of the Morrowind Screenshots project and Morrowind in general. Enjoy reading it!\n\n[Medium (English)](https://medium.com/@dmepikh/ive-been-photographing-morrowind-for-15-years-interview-with-the-founder-of-the-morrowind-a5ee65712217)  \n[DTF (Russian)](https://dtf.ru/screenshots/3312760-fotografiruyu-morrowind-uzhe-15-let-intervyu-s-osnovatelem-proekta-morrowind-screenshots)  \n[StopGame (Russian)](https://stopgame.ru/blogs/topic/117167/fotografiruyu_morrowind_uzhe_15_let_interview_s_osnovatelem_proekta_morrowind_screenshots)',
    descriptionRu:
      'Дорогие подписчики! Делюсь с вами интервью, взятым у меня игровым блогером Дмитрием Епихиным. Оно полностью\nпосвящено рассказу о проекте Morrowind Screenshots и о Morrowind в целом. Приятного чтения!\n\n[DTF (Русский)](https://dtf.ru/screenshots/3312760-fotografiruyu-morrowind-uzhe-15-let-intervyu-s-osnovatelem-proekta-morrowind-screenshots)  \n[StopGame (Русский)](https://stopgame.ru/blogs/topic/117167/fotografiruyu_morrowind_uzhe_15_let_interview_s_osnovatelem_proekta_morrowind_screenshots)  \n[Medium (Английский)](https://medium.com/@dmepikh/ive-been-photographing-morrowind-for-15-years-interview-with-the-founder-of-the-morrowind-a5ee65712217)',
    content: 'store:/shots/2017-01-23-when-you-meet-yourself.png',
    type: 'news',
    author: ['dmepikh', 'dehero'],
    mark: 'A1',
  },
  'extras',
];

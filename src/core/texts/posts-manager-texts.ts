import type { IntlText } from '../entities/intl.js';

export const postsManagerTexts = {
  posts: ['Posts', 'Посты'],
  postsUnit: [
    '{count, plural, one {post} other {posts}}',
    '{count, plural, one {пост} few {поста} many {постов} other {поста}}',
  ],
  postsWithCount: [
    '{count, plural, one {{count} post} other {{count} posts}}',
    '{count, plural, one {{count} пост} few {{count} поста} many {{count} постов} other {{count} поста}}',
  ],
  extras: ['Extras', 'Материалы'],
  extrasUnit: [
    '{count, plural, one {extra} other {extras}}',
    '{count, plural, one {материал} few {материала} many {материалов} other {материала}}',
  ],
  extrasWithCount: [
    '{count, plural, one {{count} extra} other {{count} extras}}',
    '{count, plural, one {{count} материал} few {{count} материала} many {{count} материалов} other {{count} материала}}',
  ],
  drafts: ['Drafts', 'Черновики'],
  draftsUnit: [
    '{count, plural, one {draft} other {drafts}}',
    '{count, plural, one {черновик} few {черновика} many {черновиков} other {черновика}}',
  ],
  draftsWithCount: [
    '{count, plural, one {{count} draft} other {{count} drafts}}',
    '{count, plural, one {{count} черновик} few {{count} черновика} many {{count} черновиков} other {{count} черновика}}',
  ],
  rejects: ['Rejects', 'Отклонённые'],
  rejectsUnit: [
    '{count, plural, one {reject} other {rejects}}',
    '{count, plural, one {отклонённый} few {отклонённых} many {отклонённых} other {отклонённого}}',
  ],
  rejectsWithCount: [
    '{count, plural, one {{count} reject} other {{count} rejects}}',
    '{count, plural, one {{count} отклонённый} few {{count} отклонённых} many {{count} отклонённых} other {{count} отклонённых}}',
  ],
} satisfies Record<string, IntlText>;

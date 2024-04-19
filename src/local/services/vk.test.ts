import assert from 'node:assert';
import { test } from 'node:test';
import type { Post } from '../../core/entities/post.js';
import { createCaption } from './vk.js';

test('createCaption', async (t) => {
  const post: Post = {
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
  };

  await t.test('should create proper post caption on Russian', async () => {
    const caption = await createCaption(post);

    assert.strictEqual(
      caption,
      "Альд'рун, под Скаром\nот someone\n#morrowind #elderscrolls #screenshot #openmw #sometag #anothertag\n\nАльд'рун, Район поместий\n20.11.2016",
    );
  });
});

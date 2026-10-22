import assert from 'node:assert';
import { test } from 'node:test';
import yaml from 'js-yaml';
import type { PublicationComments } from '../../../core/entities/publication.ts';
import { YAML_SCHEMA } from './yaml.ts';

function serialize(data: unknown) {
  return yaml.dump(data, { schema: YAML_SCHEMA });
}

function deserialize<T>(data: string) {
  return yaml.load(data, { schema: YAML_SCHEMA }) as T;
}

test('PublicationComments', async (t) => {
  await t.test('should keep comments without score', () => {
    const comments: PublicationComments = [
      {
        datetime: new Date('2025-01-02T03:04:05Z'),
        author: 'buyer',
        text: 'Great calendar!',
        replies: [],
      },
    ];

    assert.deepStrictEqual(deserialize<{ comments: PublicationComments }>(serialize({ comments })).comments, comments);
  });

  await t.test('should keep comment score and replies', () => {
    const comments: PublicationComments = [
      {
        datetime: new Date('2025-01-02T03:04:05Z'),
        author: 'buyer',
        text: 'Great calendar!',
        score: 5,
        replies: [
          {
            datetime: new Date('2025-01-02T04:05:06Z'),
            author: 'Morrowind Screenshots',
            text: 'Thank you!',
          },
        ],
      },
    ];

    assert.deepStrictEqual(deserialize<{ comments: PublicationComments }>(serialize({ comments })).comments, [
      {
        datetime: new Date('2025-01-02T03:04:05Z'),
        author: 'buyer',
        text: 'Great calendar!',
        score: 5,
        replies: [
          {
            datetime: new Date('2025-01-02T04:05:06Z'),
            author: 'Morrowind Screenshots',
            text: 'Thank you!',
            replies: [],
          },
        ],
      },
    ]);
  });
});

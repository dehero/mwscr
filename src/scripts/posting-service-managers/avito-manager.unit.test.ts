import assert from 'node:assert';
import { test } from 'node:test';
import { createReviewAuthorProfile, createReviewComments } from './avito-manager.ts';
import type { AvitoReview } from './avito-manager.ts';

const baseReview = {
  id: 1,
  score: 5,
  createdAt: 1_700_000_000,
  text: 'Great calendar!',
  item: { id: 7770379837 },
  sender: { name: 'Buyer' },
};

const resolveAuthor = async (review: AvitoReview) => review.sender?.name?.trim() ?? 'anonimous';

test('createReviewAuthorProfile', async (t) => {
  await t.test('should create distinct profiles for same-named reviewers', () => {
    const profile1 = createReviewAuthorProfile({ ...baseReview, id: 1, sender: { name: 'Анастасия' } }, 'av');
    const profile2 = createReviewAuthorProfile({ ...baseReview, id: 2, sender: { name: 'Анастасия' } }, 'av');

    assert.strictEqual(profile1?.name, 'Анастасия');
    assert.strictEqual(profile2?.name, 'Анастасия');
    assert.notStrictEqual(profile1?.id, profile2?.id);
  });

  await t.test('should return undefined for a review without sender name', () => {
    assert.strictEqual(createReviewAuthorProfile({ ...baseReview, sender: null }, 'av'), undefined);
  });
});

test('createReviewComments', async (t) => {
  await t.test('should map reviews of the requested item', async () => {
    const comments = await createReviewComments(
      [baseReview, { ...baseReview, id: 2, item: { id: 123 } }, { ...baseReview, id: 3, item: null }],
      7770379837,
      resolveAuthor,
    );

    assert.deepStrictEqual(comments, [
      {
        datetime: new Date(1_700_000_000 * 1000),
        author: 'Buyer',
        text: 'Great calendar!',
        score: 5,
      },
    ]);
  });

  await t.test('should sort reviews by date', async () => {
    const comments = await createReviewComments(
      [
        { ...baseReview, id: 2, createdAt: 1_700_000_100, text: 'Second' },
        { ...baseReview, id: 1, createdAt: 1_700_000_000, text: 'First' },
      ],
      '7770379837',
      resolveAuthor,
    );

    assert.deepStrictEqual(
      comments.map((comment) => comment.text),
      ['First', 'Second'],
    );
  });

  await t.test('should add published answer as a reply', async () => {
    const comments = await createReviewComments(
      [
        {
          ...baseReview,
          answer: { text: 'Thank you!', status: 'published', createdAt: 1_700_000_100 },
        },
      ],
      7770379837,
      resolveAuthor,
    );

    assert.deepStrictEqual(comments[0]?.replies, [
      {
        datetime: new Date(1_700_000_100 * 1000),
        author: 'dehero',
        text: 'Thank you!',
      },
    ]);
  });

  await t.test('should ignore unpublished answers and unknown sender names', async () => {
    const names: Array<string | undefined> = [];
    const comments = await createReviewComments(
      [
        {
          ...baseReview,
          sender: null,
          answer: { text: 'Thank you!', status: 'moderation', createdAt: 1_700_000_100 },
        },
      ],
      7770379837,
      async (review) => {
        names.push(review.sender?.name?.trim());
        return resolveAuthor(review);
      },
    );

    assert.deepStrictEqual(names, [undefined]);
    assert.strictEqual(comments[0]?.author, 'anonimous');
    assert.strictEqual(comments[0]?.replies, undefined);
  });
});

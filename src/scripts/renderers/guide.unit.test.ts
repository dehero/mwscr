import assert from 'assert';
import { test } from 'node:test';
import type { TopicEntry } from '../../core/entities/topic.ts';
import { type GuideOrderNode, createGuideSections, renderGuide } from './guide.ts';

const entries: TopicEntry[] = [
  ['', { body: 'Intro.', relatedTopicIds: [] }],
  ['a', { title: 'a', body: 'A.', relatedTopicIds: [] }],
  ['b', { title: 'b', body: 'B.', relatedTopicIds: [] }],
  ['c', { title: 'c', body: 'See [b](./b.md) and [Go](/posts/?type=shot).', relatedTopicIds: [] }],
  ['no-mods', { title: 'no mods', body: 'No mods body.', relatedTopicIds: [] }],
  ['orphan', { title: 'orphan', body: 'Orphan.', relatedTopicIds: [] }],
];

const order: GuideOrderNode[] = [{ id: 'a', children: [{ id: 'b' }] }, { id: 'c' }, { id: 'no-mods' }];

test('topic guide', async (t) => {
  await t.test('should follow the explicit order and nesting', () => {
    const sections = createGuideSections(entries, order);

    assert.deepStrictEqual(
      sections.map((section) => [section.id, section.level]),
      [
        ['a', 1],
        ['b', 2],
        ['c', 1],
        ['no-mods', 1],
        ['', 1],
        ['orphan', 1],
      ],
    );
  });

  await t.test('should append topics missing from the order alphabetically', () => {
    const orderedIds = ['a', 'b', 'c', 'no-mods'];
    const sections = createGuideSections(entries, order);

    assert.deepStrictEqual(
      sections.filter((section) => !orderedIds.includes(section.id)).map((section) => section.id),
      ['', 'orphan'],
    );
  });

  await t.test('should be deterministic', () => {
    assert.deepStrictEqual(createGuideSections(entries, order), createGuideSections(entries, order));
  });

  await t.test('should render header, contents, anchors and rewritten links', () => {
    const markdown = renderGuide(entries, 'en-GB', order);

    assert.ok(markdown.startsWith('EN [RU](CONTRIBUTING.ru.md)'));
    assert.ok(markdown.includes('# Guide'));
    assert.ok(markdown.includes('Intro.'));
    assert.ok(markdown.includes('## Contents'));
    assert.ok(markdown.includes('- [A](#a)'));
    assert.ok(markdown.includes('  - [B](#b)'));
    assert.ok(markdown.includes('<a id="a"></a>'));
    assert.ok(markdown.includes('## A'));
    assert.ok(markdown.includes('### B'));
    assert.ok(markdown.includes('[b](#b)'));
    assert.ok(markdown.includes('## Orphan'));
  });

  await t.test('should prefix root-relative links with the language origin', () => {
    const en = renderGuide(entries, 'en-GB', order);
    const ru = renderGuide(entries, 'ru', order);

    assert.ok(en.includes('[Go](https://mwscr.dehero.site/posts/?type=shot)'));
    assert.ok(ru.includes('[Go](https://mwscr.dehero.ru/posts/?type=shot)'));
  });

  await t.test('should render possible violations for mapped topics', () => {
    const en = renderGuide(entries, 'en-GB', order);
    const ru = renderGuide(entries, 'ru', order);

    assert.ok(en.includes('> **Possible Violation:** Uses or requires mods'));
    assert.ok(ru.includes('> **Возможное нарушение:** Использование модов'));
  });

  await t.test('should render the language switcher for Russian', () => {
    const markdown = renderGuide(entries, 'ru', order);

    assert.ok(markdown.startsWith('[EN](CONTRIBUTING.md) RU'));
    assert.ok(markdown.includes('# Руководство'));
  });
});

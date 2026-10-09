import assert from 'assert';
import { test } from 'node:test';
import type { TopicSourceEntry } from './topic.ts';
import type { RenderTopicGuideOptions, TopicGuideOrderNode } from './topic-guide.ts';
import { createTopicGuideSections, renderTopicGuide } from './topic-guide.ts';

const entries: TopicSourceEntry[] = [
  ['', { markdown: 'Intro.', relatedTopicIds: [] }],
  ['a', { title: 'a', markdown: '# a\n\nA.', relatedTopicIds: [] }],
  ['b', { title: 'b', markdown: '# b\n\nB.', relatedTopicIds: [] }],
  ['c', { title: 'c', markdown: '# c\n\nSee [b](./b.md) and [Go](/posts/?type=shot).', relatedTopicIds: [] }],
  ['no-mods', { title: 'no mods', markdown: '# no mods\n\nNo mods body.', relatedTopicIds: [] }],
  ['orphan', { title: 'orphan', markdown: '# orphan\n\nOrphan.', relatedTopicIds: [] }],
];

const order: TopicGuideOrderNode[] = [{ id: 'a', children: [{ id: 'b' }] }, { id: 'c' }, { id: 'no-mods' }];

const options: RenderTopicGuideOptions = {
  enFilename: 'CONTRIBUTING.md',
  ruFilename: 'CONTRIBUTING.ru.md',
  enOrigin: 'https://mwscr.dehero.site',
  ruOrigin: 'https://mwscr.dehero.ru',
};

test('topic guide', async (t) => {
  await t.test('should follow the explicit order and nesting', () => {
    const sections = createTopicGuideSections(entries, order);

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
    const sections = createTopicGuideSections(entries, order);

    assert.deepStrictEqual(
      sections.filter((section) => !orderedIds.includes(section.id)).map((section) => section.id),
      ['', 'orphan'],
    );
  });

  await t.test('should be deterministic', () => {
    assert.deepStrictEqual(createTopicGuideSections(entries, order), createTopicGuideSections(entries, order));
  });

  await t.test('should render header, contents, anchors and rewritten links', () => {
    const markdown = renderTopicGuide(entries, 'en', options, order);

    assert.ok(markdown.startsWith('`EN` [`RU`](CONTRIBUTING.ru.md)'));
    assert.ok(markdown.includes('# Contributing Guidelines'));
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
    const en = renderTopicGuide(entries, 'en', options, order);
    const ru = renderTopicGuide(entries, 'ru', options, order);

    assert.ok(en.includes('[Go](https://mwscr.dehero.site/posts/?type=shot)'));
    assert.ok(ru.includes('[Go](https://mwscr.dehero.ru/posts/?type=shot)'));
  });

  await t.test('should render possible violations for mapped topics', () => {
    const en = renderTopicGuide(entries, 'en', options, order);
    const ru = renderTopicGuide(entries, 'ru', options, order);

    assert.ok(en.includes('> **Possible Violation:** Uses or requires mods'));
    assert.ok(ru.includes('> **Возможное нарушение:** Использование модов'));
  });

  await t.test('should render the language switcher for Russian', () => {
    const markdown = renderTopicGuide(entries, 'ru', options, order);

    assert.ok(markdown.startsWith('[`EN`](CONTRIBUTING.md) `RU`'));
    assert.ok(markdown.includes('# Руководство для участников'));
  });
});

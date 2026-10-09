import assert from 'assert';
import { test } from 'node:test';
import { markdownToHtml } from './markdown.ts';

test('markdownToHtml', async (t) => {
  await t.test('should extract the title and keep inline text', () => {
    const { html, title } = markdownToHtml('# topic title\n\nSome plain text.');

    assert.strictEqual(title, 'topic title');
    assert.strictEqual(html, 'Some plain text.');
  });

  await t.test('should render a table with an underlined header and alignment', () => {
    const markdown = ['| Name | Value |', '| ---- | :---: |', '| one  | two   |'].join('\n');
    const { html } = markdownToHtml(markdown);

    assert.strictEqual(
      html,
      '<table><thead><tr><th>Name</th><th style="text-align: center">Value</th></tr></thead>' +
        '<tbody><tr><td>one</td><td style="text-align: center">two</td></tr></tbody></table>',
    );
  });

  await t.test('should not treat a lone horizontal rule as a table', () => {
    const { html } = markdownToHtml('First part\n\n---\n\nSecond part');

    assert.strictEqual(html, 'First part<br /><br />---<br /><br />Second part');
  });

  await t.test('should render images', () => {
    const { html } = markdownToHtml('![alt text](/help/image.svg)');

    assert.strictEqual(html, '<img src="/help/image.svg" alt="alt text" />');
  });

  await t.test('should use a single line break around tables', () => {
    const markdown = ['Text:', '', '| A | B |', '| - | - |', '| 1 | 2 |', '', 'After'].join('\n');
    const { html } = markdownToHtml(markdown);

    assert.strictEqual(
      html,
      'Text:<br /><table><thead><tr><th>A</th><th>B</th></tr></thead>' +
        '<tbody><tr><td>1</td><td>2</td></tr></tbody></table><br />After',
    );
  });

  await t.test('should render inline code', () => {
    const { html } = markdownToHtml('Type `tgm` to enable god mode.');

    assert.strictEqual(html, 'Type <code>tgm</code> to enable god mode.');
  });

  await t.test('should render fenced code blocks and escape their content', () => {
    const markdown = ['```', 'player->setspeed 500', 'a < b & c > d', '```'].join('\n');
    const { html } = markdownToHtml(markdown);

    assert.strictEqual(html, '<pre><code>player-&gt;setspeed 500\na &lt; b &amp; c &gt; d</code></pre>');
  });

  await t.test('should use a single line break around code blocks', () => {
    const markdown = ['Before', '', '```', 'code', '```', '', 'After'].join('\n');
    const { html } = markdownToHtml(markdown);

    assert.strictEqual(html, 'Before<br /><pre><code>code</code></pre><br />After');
  });

  await t.test('should not convert links and images inside code', () => {
    const { html } = markdownToHtml('`[Link](./shot.md)` and `` not a fence');

    assert.strictEqual(html, '<code>[Link](./shot.md)</code> and `` not a fence');
  });

  await t.test('should replace links inside table cells', () => {
    const markdown = ['| Type | Link |', '| ---- | ---- |', '| Shot | [Shot](./shot.md) |'].join('\n');
    const { html } = markdownToHtml(markdown, () => ['/help/shot/', false]);

    assert.strictEqual(
      html,
      '<table><thead><tr><th>Type</th><th>Link</th></tr></thead>' +
        '<tbody><tr><td>Shot</td><td><a href="/help/shot/">Shot</a></td></tr></tbody></table>',
    );
  });
});

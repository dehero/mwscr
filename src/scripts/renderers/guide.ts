import { site } from '../../core/services/site.ts';
import { texts } from '../../core/texts/index.ts';
import { localField, localize } from '../../core/utils/intl-utils.ts';
import { capitalize } from '../../core/utils/string-utils.ts';
import { getTopicIdFromFilename, TOPIC_INDEX_ID, type Topic, type TopicEntry } from '../../core/entities/topic.ts';
import type { Locale } from '../../core/entities/intl.ts';
import { postViolationDescriptors } from '../../core/entities/post.ts';

/**
 * A node of the guide table of contents. Nesting defines heading levels, so the
 * resulting document order is fully determined by this tree.
 */
export interface GuideOrderNode {
  id: string;
  children?: GuideOrderNode[];
}

export interface GuideSection {
  id: string;
  level: number;
  topic: Topic;
}

const TOPIC_MARKDOWN_LINK_REGEX = /\]\(\.\/([^)]+\.md)\)/g;
const ROOT_RELATIVE_MARKDOWN_LINK_REGEX = /\]\((\/[^)]*)\)/g;
const MAX_HEADING_LEVEL = 6;

/**
 * Returns sections in the exact order defined by `order`, with levels derived
 * from nesting. Topics present in the data but missing from `order` are
 * appended alphabetically so nothing is silently dropped.
 */
export function createGuideSections(entries: Iterable<TopicEntry>, order: GuideOrderNode[]): GuideSection[] {
  const topics = new Map<string, Topic | undefined>();

  for (const [id, topic] of entries) {
    topics.set(id, topic);
  }

  const sections: GuideSection[] = [];
  const placed = new Set<string>();

  const add = (id: string, level: number) => {
    const topic = topics.get(id);

    if (!topic || placed.has(id)) {
      return;
    }

    placed.add(id);
    sections.push({ id, level, topic });
  };

  const visit = (nodes: GuideOrderNode[], level: number) => {
    for (const node of nodes) {
      add(node.id, level);

      if (node.children) {
        visit(node.children, level + 1);
      }
    }
  };

  visit(order, 1);

  for (const id of [...topics.keys()].filter((topicId) => !placed.has(topicId)).sort()) {
    add(id, 1);
  }

  return sections;
}

export function renderGuide(entries: Iterable<TopicEntry>, locale: Locale, order: GuideOrderNode[]): string {
  const sections = createGuideSections(entries, order).map((section) => ({
    ...section,
    title: localField(section.topic, 'title', locale),
    body: localField(section.topic, 'body', locale),
  }));

  const blocks = [renderHeader(locale), `# ${localize(texts.guide.title, locale)}`];

  const origin = locale === 'ru' ? site.originRu : site.originEn;

  const introduction = sections.find((section) => section.id === TOPIC_INDEX_ID);
  if (introduction?.body) {
    blocks.push(renderBody(introduction.body, origin));
  }

  const titledSections = sections.filter((section) => section.id !== TOPIC_INDEX_ID && section.title);

  blocks.push(`## ${localize(texts.guide.contents, locale)}`, renderContents(titledSections));

  const content = titledSections.map((section, index) => renderSection(section, index, locale, origin)).join('\n\n');

  if (content) {
    blocks.push('---', content);
  }

  return normalizeMarkdown(`${blocks.join('\n\n')}\n`);
}

function renderHeader(locale: Locale) {
  return locale === 'ru'
    ? `[${localize(texts.common.language, locale, true)}](${localize(texts.guide.filename, locale, true)}) ${localize(texts.common.language, locale)}`
    : `${localize(texts.common.language, locale)} [${localize(texts.common.language, locale, true)}](${localize(texts.guide.filename, locale, true)})`;
}

function renderContents(sections: (GuideSection & { title?: string })[]) {
  return sections
    .map((section) => {
      const indent = '  '.repeat(Math.max(section.level - 1, 0));

      return `${indent}- [${capitalize(section.title as string)}](#${section.id})`;
    })
    .join('\n');
}

function renderSection(
  section: GuideSection & { title?: string; body?: string },
  index: number,
  locale: Locale,
  origin: string,
) {
  const level = Math.min(Math.max(section.level + 1, 1), MAX_HEADING_LEVEL);
  const heading = `${'#'.repeat(level)} ${capitalize(section.title as string)}`;
  const parts = [`<a id="${section.id}"></a>`, heading];

  if (section.body) {
    parts.push(renderBody(section.body, origin));
  }

  const violation = Object.values(postViolationDescriptors).find((descriptor) => descriptor.topicId === section.id);
  if (violation) {
    const label = localize(texts.postViolation.possibleViolation, locale);

    parts.push(`> **${label}:** ${localize(violation.title, locale)}`);
  }

  const text = parts.join('\n\n');

  return section.level === 1 && index > 0 ? `---\n\n${text}` : text;
}

function renderBody(markdown: string, origin: string) {
  return rewriteRootRelativeLinks(rewriteTopicLinks(stripMarkdownTitle(markdown)), origin).trim();
}

function stripMarkdownTitle(markdown: string) {
  return markdown.replace(/^#\s+.*(?:\r?\n)*/, '');
}

function rewriteTopicLinks(markdown: string) {
  return markdown.replace(TOPIC_MARKDOWN_LINK_REGEX, (match: string, filename: string) => {
    const id = getTopicIdFromFilename(filename);

    return id ? `](#${id})` : match;
  });
}

function rewriteRootRelativeLinks(markdown: string, origin: string) {
  return markdown.replace(ROOT_RELATIVE_MARKDOWN_LINK_REGEX, `](${origin}$1)`);
}

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\n{3,}/g, '\n\n');
}

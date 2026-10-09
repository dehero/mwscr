import { texts } from '../texts/index.ts';
import { localize } from '../utils/intl-utils.ts';
import { capitalize } from '../utils/string-utils.ts';
import type { Locale } from './intl.ts';
import { postViolationDescriptors } from './post.ts';
import { getTopicIdFromFilename, TOPIC_INDEX_ID, type TopicSource, type TopicSourceEntry } from './topic.ts';

export type TopicGuideLanguage = 'en' | 'ru';

/**
 * A node of the guide table of contents. Nesting defines heading levels, so the
 * resulting document order is fully determined by this tree.
 */
export interface TopicGuideOrderNode {
  id: string;
  children?: TopicGuideOrderNode[];
}

export interface TopicGuideSection {
  id: string;
  level: number;
  topic: TopicSource;
}

export interface RenderTopicGuideOptions {
  enFilename: string;
  ruFilename: string;
  enOrigin: string;
  ruOrigin: string;
}

const TOPIC_MARKDOWN_LINK_REGEX = /\]\(\.\/([^)]+\.md)\)/g;
const ROOT_RELATIVE_MARKDOWN_LINK_REGEX = /\]\((\/[^)]*)\)/g;
const MAX_HEADING_LEVEL = 6;

const LOCALES: Record<TopicGuideLanguage, Locale> = {
  en: 'en-GB',
  ru: 'ru',
};

const DOCUMENT_TITLES: Record<TopicGuideLanguage, string> = {
  en: 'Contributing Guidelines',
  ru: 'Руководство для участников',
};

const CONTENTS_TITLES: Record<TopicGuideLanguage, string> = {
  en: 'Contents',
  ru: 'Содержание',
};

/**
 * Returns sections in the exact order defined by `order`, with levels derived
 * from nesting. Topics present in the data but missing from `order` are
 * appended alphabetically so nothing is silently dropped.
 */
export function createTopicGuideSections(
  entries: Iterable<TopicSourceEntry>,
  order: TopicGuideOrderNode[],
): TopicGuideSection[] {
  const topics = new Map(entries);
  const sections: TopicGuideSection[] = [];
  const placed = new Set<string>();

  const add = (id: string, level: number) => {
    const topic = topics.get(id);

    if (!topic || placed.has(id)) {
      return;
    }

    placed.add(id);
    sections.push({ id, level, topic });
  };

  const visit = (nodes: TopicGuideOrderNode[], level: number) => {
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

export function renderTopicGuide(
  entries: Iterable<TopicSourceEntry>,
  language: TopicGuideLanguage,
  options: RenderTopicGuideOptions,
  order: TopicGuideOrderNode[],
): string {
  const sections = createTopicGuideSections(entries, order).map((section) => ({
    ...section,
    ...localizeTopic(section.topic, language),
  }));

  const blocks = [renderHeader(language, options), `# ${DOCUMENT_TITLES[language]}`];

  const origin = language === 'ru' ? options.ruOrigin : options.enOrigin;

  const introduction = sections.find((section) => section.id === TOPIC_INDEX_ID);
  if (introduction?.markdown) {
    blocks.push(renderBody(introduction.markdown, origin));
  }

  const titledSections = sections.filter((section) => section.id !== TOPIC_INDEX_ID && section.title);

  blocks.push(`## ${CONTENTS_TITLES[language]}`, renderContents(titledSections));

  const content = titledSections.map((section, index) => renderSection(section, index, language, origin)).join('\n\n');

  if (content) {
    blocks.push('---', content);
  }

  return normalizeMarkdown(`${blocks.join('\n\n')}\n`);
}

function localizeTopic(topic: TopicSource, language: TopicGuideLanguage) {
  return {
    title: language === 'ru' ? (topic.titleRu ?? topic.title) : topic.title,
    markdown: language === 'ru' ? (topic.markdownRu ?? topic.markdown) : topic.markdown,
  };
}

function renderHeader(language: TopicGuideLanguage, options: RenderTopicGuideOptions) {
  const en = '`EN`';
  const ru = '`RU`';

  return language === 'ru' ? `[${en}](${options.enFilename}) ${ru}` : `${en} [${ru}](${options.ruFilename})`;
}

function renderContents(sections: (TopicGuideSection & { title?: string })[]) {
  return sections
    .map((section) => {
      const indent = '  '.repeat(Math.max(section.level - 1, 0));

      return `${indent}- [${capitalize(section.title as string)}](#${section.id})`;
    })
    .join('\n');
}

function renderSection(
  section: TopicGuideSection & { title?: string; markdown?: string },
  index: number,
  language: TopicGuideLanguage,
  origin: string,
) {
  const locale = LOCALES[language];
  const level = Math.min(Math.max(section.level + 1, 1), MAX_HEADING_LEVEL);
  const heading = `${'#'.repeat(level)} ${capitalize(section.title as string)}`;
  const parts = [`<a id="${section.id}"></a>`, heading];

  if (section.markdown) {
    parts.push(renderBody(section.markdown, origin));
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

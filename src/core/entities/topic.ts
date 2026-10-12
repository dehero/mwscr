import type { MarkdownLinkReplacer } from './markdown.ts';

export interface Topic {
  title?: string;
  titleRu?: string;
  body: string;
  bodyRu?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic | undefined, ...unknown[]];

const TOPIC_ID_REGEX = /([^\/\\]+).md$/;
const MARKDOWN_TITLE_LINE_REGEX = /^#\s+(.*)$/m;
const TOPIC_MARKDOWN_LINK_REGEX = /\]\(\.\/([^)]+\.md)\)/g;

export const TOPIC_INDEX_ID = '';
export const TOPIC_INDEX_BASENAME = 'index';

export function getTopicIdFromFilename(filename: string) {
  const [, basename] = TOPIC_ID_REGEX.exec(filename) ?? [];
  return getTopicIdFromBasename(basename ?? '');
}

export function getTopicIdFromBasename(basename: string) {
  return basename === TOPIC_INDEX_BASENAME ? TOPIC_INDEX_ID : basename || TOPIC_INDEX_ID;
}

export function getTopicBasenameFromId(id: string) {
  return id === TOPIC_INDEX_ID ? TOPIC_INDEX_BASENAME : id || TOPIC_INDEX_BASENAME;
}

/**
 * Rewrites topic markdown links for the site: `./topic.md` links point to the
 * help route of the referenced topic, while all other links are marked as
 * external.
 */
export const topicLinkReplacer: MarkdownLinkReplacer = (url) => {
  if (url.startsWith('./')) {
    const [, topicId] = TOPIC_ID_REGEX.exec(url) ?? [];

    return topicId ? [`/help/${topicId}/`, false] : [url, false];
  }

  return [url, true];
};

function splitMarkdownTitle(markdown: string) {
  const match = MARKDOWN_TITLE_LINE_REGEX.exec(markdown);

  if (!match) {
    return { title: undefined, body: markdown };
  }

  return {
    title: match[1]?.trim(),
    body: `${markdown.slice(0, match.index)}${markdown.slice(match.index + match[0].length)}`.trim(),
  };
}

function extractRelatedTopicIds(text: string | undefined) {
  if (!text) {
    return [];
  }

  return [...text.matchAll(TOPIC_MARKDOWN_LINK_REGEX)].flatMap((match) => {
    const [, topicId] = TOPIC_ID_REGEX.exec(match[1] ?? '') ?? [];

    return topicId ? [topicId] : [];
  });
}

export function createTopicEntryFromMarkdown(code: string, filename: string): TopicEntry {
  const id = getTopicIdFromFilename(filename);
  const [source = '', sourceRu] = code.split(/^---$/m, 2).map((part) => part.trim());

  const content = splitMarkdownTitle(source);
  const contentRu = sourceRu ? splitMarkdownTitle(sourceRu) : undefined;

  return [
    id,
    {
      title: content.title,
      titleRu: contentRu?.title,
      body: content.body,
      bodyRu: contentRu?.body,
      relatedTopicIds: [...new Set(extractRelatedTopicIds(code))],
    },
  ];
}

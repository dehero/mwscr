import { type MarkdownLinkReplacer, markdownToHtml } from './markdown.ts';

export interface Topic {
  title?: string;
  titleRu?: string;
  html?: string;
  htmlRu?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic | undefined, ...unknown[]];

const TOPIC_ID_REGEX = /([^\/\\]+).md$/;
const TOPIC_MARKDOWN_LINK_REGEX = /\]\(\.\/([^)]+\.md)\)/g;
const TOPIC_MARKDOWN_CODE_FENCE_REGEX = /^[^\S\r\n]*```[^\n]*\n[\s\S]*?^[^\S\r\n]*```[^\S\r\n]*$/gm;
const MARKDOWN_TITLE_LINE_REGEX = /^#\s+(.*)$/m;

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

export function createTopicEntryFromMarkdown(code: string, filename: string): TopicEntry {
  const id = getTopicIdFromFilename(filename);
  const relatedTopicIds: string[] = [];
  const [markdown = '', markdownRu] = code.split(/^---$/m, 2).map((part) => part.trim());

  const linkReplacer: MarkdownLinkReplacer = (url) => {
    let href = url;
    const external = !url.startsWith('./');
    if (!external) {
      const [, topicId] = TOPIC_ID_REGEX.exec(url) ?? [];
      if (topicId) {
        relatedTopicIds.push(topicId);
        href = `/help/${topicId}/`;
      }
    }

    return [href, external];
  };

  const { html, title } = markdownToHtml(markdown, linkReplacer);
  const { html: htmlRu, title: titleRu } = markdownToHtml(markdownRu ?? '', linkReplacer);

  return [id, { title, titleRu, html, htmlRu, relatedTopicIds: [...new Set(relatedTopicIds)] }];
}

/**
 * Raw source of a topic, kept in Markdown form. Unlike {@link Topic}, which
 * contains only rendered HTML, this is used to assemble combined Markdown
 * documents (for example, the contributing guidelines).
 */
export interface TopicSource {
  title?: string;
  titleRu?: string;
  markdown: string;
  markdownRu?: string;
  relatedTopicIds: string[];
}

export type TopicSourceEntry = [string, TopicSource];

/**
 * Returns IDs of the topics referenced from the given Markdown. Links inside
 * code blocks are ignored to match {@link createTopicEntryFromMarkdown}.
 */
export function extractRelatedTopicIds(markdown: string): string[] {
  const source = markdown.replace(TOPIC_MARKDOWN_CODE_FENCE_REGEX, '');
  const ids: string[] = [];

  for (const match of source.matchAll(TOPIC_MARKDOWN_LINK_REGEX)) {
    const id = getTopicIdFromFilename(match[1] ?? '');

    if (id) {
      ids.push(id);
    }
  }

  return ids;
}

export function createTopicSourceFromMarkdown(code: string, filename: string): TopicSourceEntry {
  const id = getTopicIdFromFilename(filename);
  const [markdown = '', markdownRu] = code.split(/^---$/m, 2).map((part) => part.trim());

  return [
    id,
    {
      title: extractMarkdownTitle(markdown),
      titleRu: markdownRu ? extractMarkdownTitle(markdownRu) : undefined,
      markdown,
      markdownRu,
      relatedTopicIds: [...new Set([...extractRelatedTopicIds(markdown), ...extractRelatedTopicIds(markdownRu ?? '')])],
    },
  ];
}

function extractMarkdownTitle(markdown: string) {
  return MARKDOWN_TITLE_LINE_REGEX.exec(markdown)?.[1]?.trim();
}

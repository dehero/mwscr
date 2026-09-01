import { markdownToInlineHtml, type MarkdownLinkReplacer } from './markdown.js';

export interface Topic {
  title?: string;
  titleRu?: string;
  html?: string;
  htmlRu?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic | undefined, ...unknown[]];

const TOPIC_ID_REGEX = /([^\/\\]+).md$/;

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

  const { html, title } = markdownToInlineHtml(markdown, linkReplacer);
  const { html: htmlRu, title: titleRu } = markdownToInlineHtml(markdownRu ?? '', linkReplacer);

  return [id, { title, titleRu, html, htmlRu, relatedTopicIds: [...new Set(relatedTopicIds)] }];
}

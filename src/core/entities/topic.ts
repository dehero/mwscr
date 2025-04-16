import { markdownToHtml } from './markdown.js';

export interface Topic {
  title?: string;
  html?: string;
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

  const { html, title } = markdownToHtml(code, (url) => {
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
  });

  return [id, { title, html, relatedTopicIds }];
}

import { markdownToHtml } from './markdown.js';

export interface Topic {
  title?: string;
  html?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic];

const TOPIC_ID_REGEX = /([^\/]+).md$/;

export function getTopicIdFromFilename(filename: string) {
  const [, id] = TOPIC_ID_REGEX.exec(filename) ?? [];
  return id === 'index' ? '' : id || '';
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

export interface Topic {
  title?: string;
  html?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic | undefined, ...unknown[]];

const TOPIC_DOUBLE_BR_REGEX = /(?:\r?\n){2}/gm;
const TOPIC_BR_REGEX = /\s\s$/gm;
const TOPIC_TITLE_REGEX = /#\s*(.*)/m;
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
  let title;

  const html = code
    .replace(TOPIC_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
    })
    .replaceAll(/\[([^\]]+)\]\(([^)]+)\)/gm, (_, title, url) => {
      let href = url;
      const external = !url.startsWith('./');
      if (!external) {
        const [, topicId] = TOPIC_ID_REGEX.exec(url) ?? [];
        if (topicId) {
          relatedTopicIds.push(topicId);
          href = `/help/${topicId}/`;
        }
      }
      return `<a href="${href}"${external ? ' target="_blank"' : ''}>${title}</a>`;
    })
    .trim()
    .replaceAll(TOPIC_DOUBLE_BR_REGEX, '<br /><br />')
    .replaceAll(TOPIC_BR_REGEX, '<br />');

  return [id, { title, html, relatedTopicIds }];
}

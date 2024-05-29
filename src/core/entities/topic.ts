export interface Topic {
  title?: string;
  html?: string;
  relatedTopicIds: string[];
}

export type TopicEntry = [string, Topic];

const TOPIC_TITLE_REGEX = /#\s*(.*)/m;
const TOPIC_ID_REGEX = /([^\/]+).md$/;

export function getTopicIdFromFilename(filename: string) {
  const [, id] = TOPIC_ID_REGEX.exec(filename) ?? [];
  return id === 'index' ? '' : id || '';
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
    .replaceAll(/(?:\r?\n){2}/gm, '<br><br>');

  return [id, { title, html, relatedTopicIds }];
}

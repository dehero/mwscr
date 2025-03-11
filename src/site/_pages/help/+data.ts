import { readdir, readFile } from 'fs/promises';
import { createTopicEntryFromMarkdown } from '../../../core/entities/topic.js';
import type { HelpPageData } from '../../components/HelpPage/HelpPage.data.js';

export const TOPICS_DIR = './src/site/topics';

// TODO: move topics extraction to vite config
export async function data(): Promise<HelpPageData> {
  const files = await readdir(TOPICS_DIR);

  const topicEntries = await Promise.all(
    files.map(async (file) => {
      const code = await readFile(`${TOPICS_DIR}/${file}`, 'utf-8');
      return createTopicEntryFromMarkdown(code, file);
    }),
  );

  return {
    topics: Object.fromEntries(topicEntries),
  };
}

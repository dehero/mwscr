import { readdir, readFile } from 'fs/promises';
import { createTopicEntryFromMarkdown } from '../../core/entities/topic.js';
import { TopicsReader } from '../../core/entities/topics-reader.js';

export const TOPICS_DIR = 'data/topics';

class LocalTopicsReader extends TopicsReader {
  protected async loadChunkNames(): Promise<string[]> {
    const files = await readdir(TOPICS_DIR);

    return files.map((file) => /^(.*)\.md$/.exec(file)?.[1]).filter((name): name is string => typeof name === 'string');
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `${chunkName}.md`;

    const code = await readFile(`${TOPICS_DIR}/${filename}`, 'utf-8');
    const entry = createTopicEntryFromMarkdown(code, filename);

    return Object.fromEntries([entry]);
  }
}

export const topics = new LocalTopicsReader();

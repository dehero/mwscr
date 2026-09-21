import type { ListReaderChunk } from '../../core/entities/list-manager.ts';
import type { Topic } from '../../core/entities/topic.ts';
import { TopicsReader } from '../../core/entities/topics-reader.ts';
import { jsonDateReviver } from '../../core/utils/date-utils.ts';
import { isObject } from '../../core/utils/object-utils.ts';

class SiteTopicsReader extends TopicsReader {
  async loadChunkNames() {
    const index = (await fetch('/data/index.json').then((r) => r.json())) as string[];

    return index
      .filter((pathname: string) => pathname.startsWith(`${this.name}/`))
      .map((pathname) => /\/([^/]+)\.json$/.exec(pathname)?.[1] || '');
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `/data/${this.name}/${chunkName}.json`;

    if (!filename) {
      throw new Error(`Chunk "${chunkName}" not found`);
    }

    try {
      const data = JSON.parse(await fetch(filename).then((r) => r.text()), jsonDateReviver) as unknown;

      if (!isObject(data)) {
        throw new TypeError(`File "${filename}" expected to be the map of topics`);
      }

      return data as ListReaderChunk<Topic>;
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }
  }
}

export const topics = new SiteTopicsReader();

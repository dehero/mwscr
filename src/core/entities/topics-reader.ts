import { ListReader } from './list-manager.ts';
import { getTopicBasenameFromId, type Topic } from './topic.ts';

export abstract class TopicsReader extends ListReader<Topic> {
  readonly name = 'topics';

  protected getItemChunkName = getTopicBasenameFromId;
}

import { ListReader } from './list-manager.js';
import type { Topic } from './topic.js';

export abstract class TopicsReader extends ListReader<Topic> {
  readonly name = 'topics';
}

import { readdir } from 'fs/promises';
import { getTopicIdFromFilename } from '../../../core/entities/topic.js';
import { helpRoute } from '../../routes/help-route.js';
import { TOPICS_DIR } from './+data.js';

export async function onBeforePrerenderStart() {
  const filenames = await readdir(TOPICS_DIR);

  return filenames.map((file) => helpRoute.createUrl({ topicId: getTopicIdFromFilename(file) }));
}

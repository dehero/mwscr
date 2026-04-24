import type { DataManager } from '../../../core/entities/data-manager.js';
import { type Topic, TOPIC_INDEX_ID } from '../../../core/entities/topic.js';
import { helpRoute, type HelpRouteParams } from '../../routes/help-route.js';

export interface HelpPageData {
  indexTopic: Topic;
  topic?: Topic;
}

export async function getHelpPageData(
  dataManager: DataManager,
  params: HelpRouteParams,
): Promise<HelpPageData | undefined> {
  const { topicId } = helpRoute.mapParams?.(params as Record<string, string>) ?? {};

  const indexTopic = await dataManager.topics.getItem(TOPIC_INDEX_ID);
  if (!indexTopic) {
    // 500
    return;
  }

  let topic;

  if (typeof topicId !== 'undefined' && topicId !== TOPIC_INDEX_ID) {
    topic = await dataManager.topics.getItem(topicId);

    if (!topic) {
      // 404
      return;
    }
  }

  return { indexTopic, topic };
}

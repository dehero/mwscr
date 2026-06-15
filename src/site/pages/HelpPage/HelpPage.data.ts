import { query } from '@solidjs/router';
import type { DataManager } from '../../../core/entities/data-manager.js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import { type Topic, TOPIC_INDEX_ID } from '../../../core/entities/topic.js';
import { dataManager } from '../../data-managers/manager.js';

export interface HelpPageData {
  indexTopic: Topic;
  topic?: Topic;
}

export interface HelpPageParams extends SiteRouteParams {
  topicId?: string;
}

export async function getHelpPageData(
  dataManager: DataManager,
  params: HelpPageParams,
): Promise<HelpPageData | undefined> {
  const indexTopic = await dataManager.topics.getItem(TOPIC_INDEX_ID);
  if (!indexTopic) {
    // 500
    return;
  }

  let topic;

  if (typeof params.topicId !== 'undefined' && params.topicId !== TOPIC_INDEX_ID) {
    topic = await dataManager.topics.getItem(params.topicId);

    if (!topic) {
      // 404
      return;
    }
  }

  return { indexTopic, topic };
}

export const queryHelpPageData = query(async (params) => getHelpPageData(dataManager, params), 'help');

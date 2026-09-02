import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';

export interface TopicInfo {
  id: string;
  title?: string;
  titleRu?: string;
}

export type TopicInfoComparator = (a: TopicInfo, b: TopicInfo) => number;

export async function createTopicInfos(dataManager: DataManager): Promise<TopicInfo[]> {
  const entries = await dataManager.topics.getAllEntries();

  return entries.map(([id, topic]) =>
    cleanupUndefinedProps({
      id,
      title: topic.title,
      titleRu: topic.titleRu,
    }),
  );
}

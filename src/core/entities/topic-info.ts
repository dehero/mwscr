import type { SortDirection } from '../utils/common-types.js';
import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';

export interface TopicInfo {
  id: string;
  title?: string;
}

export type TopicInfoComparator = (a: TopicInfo, b: TopicInfo) => number;

export async function createTopicInfos(dataManager: DataManager): Promise<TopicInfo[]> {
  const entries = await dataManager.topics.getAllEntries();

  return entries.map(([id, topic]) =>
    cleanupUndefinedProps({
      id,
      title: topic.title,
    }),
  );
}

export function compareTopicInfosByTitle(direction: SortDirection): TopicInfoComparator {
  return direction === 'asc'
    ? (a, b) => a.title?.localeCompare(b.title ?? '') ?? 0
    : (a, b) => b.title?.localeCompare(a.title ?? '') ?? 0;
}

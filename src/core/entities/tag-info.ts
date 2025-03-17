import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { DataManager } from './data-manager.js';
import { type PostsUsage } from './posts-usage.js';

export interface TagInfo {
  id: string;
  tagged?: PostsUsage;
}

export async function createTagInfos(dataManager: DataManager): Promise<TagInfo[]> {
  const result: Map<string, PostsUsage> = new Map();

  for (const manager of dataManager.postsManagers) {
    const tags = await manager.getTagsUsageStats();

    for (const [id, count] of tags) {
      result.set(id, { ...result.get(id), [manager.name]: count });
    }
  }

  return [...result].map(([id, tagged]) => cleanupUndefinedProps({ id, tagged }));
}

import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { ListReaderStats } from './list-manager.js';
import type { PostsManager, PostsManagerName } from './posts-manager.js';
import { POSTS_MANAGER_INFOS } from './posts-manager.js';

export type PostsUsage = Partial<Record<PostsManagerName, number>>;

type PostsManagerInstance = InstanceType<typeof PostsManager>;

export type PostsManagerStatsMethodName = {
  [K in keyof PostsManagerInstance]: PostsManagerInstance[K] extends () => Promise<ListReaderStats> ? K : never;
}[keyof PostsManagerInstance];

export async function createPostsUsage(
  postsManagers: PostsManager[],
  statsMethodName: PostsManagerStatsMethodName,
  key: string | ((key: string) => boolean),
): Promise<PostsUsage | undefined> {
  const result: PostsUsage = {};

  for (const manager of postsManagers) {
    const stats = await manager[statsMethodName]();
    let count;
    if (typeof key === 'string') {
      count = stats.get(key);
    } else {
      count = [...stats].filter(([value]) => key(value)).reduce((acc, [, count]) => acc + count, 0);
    }

    result[manager.name] = count || undefined;
  }

  return Object.values(result).length > 0 ? cleanupUndefinedProps(result) : undefined;
}

export function comparePostsUsages(a: PostsUsage | undefined, b?: PostsUsage | undefined) {
  for (const info of POSTS_MANAGER_INFOS) {
    const aValue = a?.[info.name] ?? 0;
    const bValue = b?.[info.name] ?? 0;
    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }

  return 0;
}

export function postsUsageToString(usage: PostsUsage | undefined) {
  if (!usage) {
    return '';
  }

  return POSTS_MANAGER_INFOS.map((info) => (usage[info.name] ? `${usage[info.name]} ${info.label}` : undefined))
    .filter((a) => a)
    .join(', ');
}

export function isPostsUsageEmpty(usage: PostsUsage | undefined) {
  return !usage || Object.values(usage).filter(Boolean).length === 0;
}

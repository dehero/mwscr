import { cleanupUndefinedProps } from '../utils/common-utils.js';
import type { ListReaderStats } from './list-manager.js';
import type { PostsManager } from './posts-manager.js';
import { postsManagerDescriptors, PostsManagerName } from './posts-manager.js';

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
  let result: PostsUsage = {};

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

  result = cleanupUndefinedProps(result);

  return Object.values(result).length > 0 ? result : undefined;
}

export function comparePostsUsages(a: PostsUsage | undefined, b?: PostsUsage | undefined) {
  for (const name of PostsManagerName.options) {
    const aValue = a?.[name] ?? 0;
    const bValue = b?.[name] ?? 0;
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

  return PostsManagerName.options
    .map((name) => (usage[name] ? `${usage[name]} ${postsManagerDescriptors[name].label}` : undefined))
    .filter((a) => a)
    .join(', ');
}

export function isPostsUsageEmpty(usage: PostsUsage | undefined) {
  return !usage || Object.values(usage).filter(Boolean).length === 0;
}

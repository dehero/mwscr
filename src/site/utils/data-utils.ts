import type { Post, PostEntriesComparator, PostFilter } from '../../core/entities/post.js';
import { getPostEntriesFromSource } from '../../core/entities/post.js';
import type { PostInfo } from '../../core/entities/post-info.js';
import { createPostInfo } from '../../core/entities/post-info.js';
import type { PostsManager } from '../../core/entities/posts-manager.js';
import { locations } from '../../local/data-managers/locations.js';
import { users } from '../../local/data-managers/users.js';

export async function getPostInfo(
  manager: PostsManager,
  compareFn?: PostEntriesComparator,
  filterFns?: PostFilter<Post, Post> | PostFilter<Post, Post>[],
): Promise<PostInfo | undefined> {
  const filterFn = filterFns
    ? Array.isArray(filterFns)
      ? (post: Post): post is Post => filterFns.every((fn) => fn(post))
      : filterFns
    : undefined;
  const [entry] = await getPostEntriesFromSource(() => manager.readAllEntries(), compareFn, filterFn, 1);

  return entry ? createPostInfo(entry, locations, users, manager.name) : undefined;
}

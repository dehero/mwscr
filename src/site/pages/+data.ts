import type { Post, PostEntriesComparator, PostFilter } from '../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  getPostEntriesFromSource,
} from '../../core/entities/post.js';
import type { PostInfo } from '../../core/entities/post-info.js';
import { createPostInfo } from '../../core/entities/post-info.js';
import { createUserInfo } from '../../core/entities/user.js';
import { locations } from '../../local/data-managers/locations.js';
import { inbox, published, trash } from '../../local/data-managers/posts.js';
import { users } from '../../local/data-managers/users.js';
import type { HomePageData } from '../components/HomePage/HomePage.jsx';

export async function getPostInfo(
  compareFn?: PostEntriesComparator,
  filterFn?: PostFilter<Post, Post>,
): Promise<PostInfo | undefined> {
  const [entry] = await getPostEntriesFromSource(() => published.readAllEntries(), compareFn, filterFn, 1);

  return entry ? createPostInfo(entry, locations, users) : undefined;
}

export async function data(): Promise<HomePageData> {
  const userInfos = await Promise.all(
    (await users.getAllEntries()).map((entry) => createUserInfo(entry, published, inbox, trash)),
  );

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  return {
    totalPosts: {
      published: await published.getItemCount(),
      pending: await inbox.getItemCount(),
      rejected: await trash.getItemCount(),
    },
    authorCount,
    requesterCount,
    lastPostInfo: await getPostInfo(comparePostEntriesById('desc')),
    topRatedPostInfo: await getPostInfo(comparePostEntriesByRating('desc')),
    topLikedPostInfo: await getPostInfo(comparePostEntriesByLikes('desc')),
  };
}

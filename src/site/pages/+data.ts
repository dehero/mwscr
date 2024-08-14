import {
  comparePostEntriesByDate,
  comparePostEntriesByLikes,
  comparePostEntriesByMark,
  comparePostEntriesByRating,
  getPostCommentCount,
  getPostEntriesFromSource,
  getPostMaxFollowers,
  getPostTotalLikes,
} from '../../core/entities/post.js';
import { isPostDraft, isPostRequest, isPublishedPost } from '../../core/entities/post-variation.js';
import { createUserInfo } from '../../core/entities/user.js';
import { getPostInfo, inbox, posts, trash } from '../../local/data-managers/posts.js';
import { users } from '../../local/data-managers/users.js';
import type { HomePageData } from '../components/HomePage/HomePage.js';

export async function data(): Promise<HomePageData> {
  const userInfos = await Promise.all(
    (await users.getAllEntries()).map((entry) => createUserInfo(entry, posts, inbox, trash)),
  );

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  const [lastPostEntry] = await getPostEntriesFromSource(
    () => posts.readAllEntries(),
    comparePostEntriesByDate('desc'),
    isPublishedPost,
    1,
  );

  const totalFollowers = lastPostEntry ? getPostMaxFollowers(lastPostEntry[1]) : 0;
  const totalLikes = (await posts.getAllEntries()).reduce((acc, [, post]) => acc + getPostTotalLikes(post), 0);
  const totalCommentCount = (await posts.getAllEntries()).reduce((acc, [, post]) => acc + getPostCommentCount(post), 0);

  return {
    buildDate: new Date(),
    totalPosts: {
      published: await posts.getItemCount(),
      pending: await inbox.getItemCount(),
      rejected: await trash.getItemCount(),
    },
    authorCount,
    requesterCount,
    lastPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc')),
    lastOriginalPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), undefined, true),
    topRatedPostInfo: await getPostInfo(posts, comparePostEntriesByRating('desc')),
    editorsChoicePostInfo: await getPostInfo(posts, comparePostEntriesByMark('desc'), undefined, true),
    topLikedPostInfo: await getPostInfo(posts, comparePostEntriesByLikes('desc')),
    lastFulfilledPostInfo: await getPostInfo(posts, comparePostEntriesByDate('desc'), isPostRequest),
    lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), isPostDraft),
    lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesByDate('desc'), isPostRequest),
    totalFollowers,
    totalLikes,
    totalCommentCount,
  };
}

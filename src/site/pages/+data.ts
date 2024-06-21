import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByMark,
  comparePostEntriesByRating,
} from '../../core/entities/post.js';
import { isPostDraft, isPostRequest } from '../../core/entities/post-variation.js';
import { createUserInfo } from '../../core/entities/user.js';
import { getPostInfo, inbox, published, trash } from '../../local/data-managers/posts.js';
import { users } from '../../local/data-managers/users.js';
import type { HomePageData } from '../components/HomePage/HomePage.js';

export async function data(): Promise<HomePageData> {
  const userInfos = await Promise.all(
    (await users.getAllEntries()).map((entry) => createUserInfo(entry, published, inbox, trash)),
  );

  const authorCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('author') ? 1 : 0), 0);
  const requesterCount = userInfos.reduce((acc, userInfo) => acc + (userInfo.roles.includes('requester') ? 1 : 0), 0);

  return {
    buildDate: new Date(),
    totalPosts: {
      published: await published.getItemCount(),
      pending: await inbox.getItemCount(),
      rejected: await trash.getItemCount(),
    },
    authorCount,
    requesterCount,
    lastPostInfo: await getPostInfo(published, comparePostEntriesById('desc')),
    lastOriginalPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), undefined, true),
    topRatedPostInfo: await getPostInfo(published, comparePostEntriesByRating('desc')),
    editorsChoicePostInfo: await getPostInfo(published, comparePostEntriesByMark('desc'), undefined, true),
    topLikedPostInfo: await getPostInfo(published, comparePostEntriesByLikes('desc')),
    lastFulfilledPostInfo: await getPostInfo(published, comparePostEntriesById('desc'), isPostRequest),
    lastProposedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), isPostDraft),
    lastRequestedPostInfo: await getPostInfo(inbox, comparePostEntriesById('desc'), isPostRequest),
  };
}

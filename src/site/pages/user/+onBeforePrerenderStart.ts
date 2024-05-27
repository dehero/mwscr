import type { OnBeforePrerenderStartAsync } from 'vike/types';
import type { Post, PostEntriesComparator } from '../../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  getPostEntriesFromSource,
} from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostInfo } from '../../../core/entities/post-info.js';
import type { PublishablePost } from '../../../core/entities/post-variation.js';
import { createUserInfo } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { locations } from '../../../local/data-managers/locations.js';
import { inbox, published, trash } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { UserPageData } from '../../components/UserPage/UserPage.js';
import { userRoute } from '../../routes/user-route.js';

export async function getUserPostInfo(
  userId: string,
  compareFn?: PostEntriesComparator,
): Promise<PostInfo | undefined> {
  const checkAuthor = (post: Post): post is PublishablePost => asArray(post.author).includes(userId);

  const [entry] = await getPostEntriesFromSource(() => published.readAllEntries(), compareFn, checkAuthor, 1);

  return entry ? createPostInfo(entry, locations, users) : undefined;
}

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<UserPageData>> {
  const entries = await users.getAllEntries(true);
  const userInfos = await Promise.all(entries.map((entry) => createUserInfo(entry, published, inbox, trash)));

  return Promise.all(
    userInfos.map(async (userInfo) => {
      return {
        url: userRoute.createUrl({ id: userInfo.id }),
        pageContext: {
          data: {
            userInfo,
            lastPostInfo: await getUserPostInfo(userInfo.id, comparePostEntriesById('desc')),
            firstPostInfo: await getUserPostInfo(userInfo.id, comparePostEntriesById('asc')),
            topRatedPostInfo: await getUserPostInfo(userInfo.id, comparePostEntriesByRating('desc')),
            topLikedPostInfo: await getUserPostInfo(userInfo.id, comparePostEntriesByLikes('desc')),
            lessLikedPostInfo: await getUserPostInfo(userInfo.id, comparePostEntriesByLikes('asc')),
          },
        },
      };
    }),
  );
}

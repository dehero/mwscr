import type { PageContext } from 'vike/types';
import { asArray } from '../../../core/utils/common-utils.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import { posts, postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { PostPageData } from '../../components/PostPage/PostPage.js';

export async function data(pageContext: PageContext): Promise<PostPageData> {
  const manager = postsManagers.find((manager) => manager.name === pageContext.routeParams?.managerName);

  const [, post, refId] = pageContext.routeParams?.id
    ? (await manager?.getEntry(pageContext.routeParams.id)) || []
    : [];
  const authorEntries = await users.getEntries(asArray(post?.author));
  const requesterEntry = post?.request?.user ? await users.getEntry(post.request.user) : undefined;
  const tagsUsage = await posts.getTagsUsageStats();

  const usedTags = post?.tags?.map((tag): [string, number] => [tag, tagsUsage.get(tag) || 0]);

  let locationInfo;
  let worldMapLocationInfo;

  if (post?.location) {
    locationInfo = await localDataExtractor.getLocationInfo(post.location);
    worldMapLocationInfo = await localDataExtractor.findWorldMapLocationInfo(post.location);
  }

  return {
    post,
    refId,
    authorEntries,
    requesterEntry,
    usedTags,
    locationInfo,
    worldMapLocationInfo,
  };
}

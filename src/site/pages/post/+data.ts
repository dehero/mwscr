import type { PageContext } from 'vike/types';
import { asArray } from '../../../core/utils/common-utils.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import { posts, postsManagers } from '../../../local/data-managers/posts.js';
import type { PostPageData } from '../../components/PostPage/PostPage.js';

export async function data(pageContext: PageContext): Promise<PostPageData> {
  const manager = postsManagers.find((manager) => manager.name === pageContext.routeParams?.managerName);

  const [, post, refId] = pageContext.routeParams?.id
    ? (await manager?.getEntry(pageContext.routeParams.id)) || []
    : [];
  const authorInfos = await localDataExtractor.getUserInfos(asArray(post?.author));
  const requesterInfo = post?.request?.user ? await localDataExtractor.getUserInfo(post.request.user) : undefined;
  const tagsUsage = await posts.getTagsUsageStats();

  const usedTags = post?.tags?.map((tag): [string, number] => [tag, tagsUsage.get(tag) || 0]);

  let locationInfos;
  let worldMapLocationInfo;

  if (post?.location) {
    locationInfos = await localDataExtractor.getLocationInfos(post.location);
    worldMapLocationInfo = await localDataExtractor.findWorldMapLocationInfo(post.location);
  }

  return {
    post,
    refId,
    authorInfos,
    requesterInfo,
    usedTags,
    locationInfos,
    worldMapLocationInfo,
  };
}

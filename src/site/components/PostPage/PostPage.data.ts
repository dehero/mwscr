import type { DataExtractor } from '../../../core/entities/data-extractor.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Post } from '../../../core/entities/post.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { asArray } from '../../../core/utils/common-utils.js';
import type { PostRouteParams } from '../../routes/post-route.js';

export interface PostPageData {
  post: Post | undefined;
  refId: string | undefined;
  authorInfos: UserInfo[] | undefined;
  requesterInfo: UserInfo | undefined;
  usedTags: Array<[string, number]> | undefined;
  locationInfos: LocationInfo[] | undefined;
  worldMapLocationInfo: LocationInfo | undefined;
}

export async function getPostPageData(dataExtractor: DataExtractor, params: PostRouteParams): Promise<PostPageData> {
  const manager = dataExtractor.findPostsManager(params.managerName);
  const posts = dataExtractor.findPostsManager('posts');

  const [, post, refId] = params.id ? (await manager?.getEntry(params.id)) || [] : [];
  const authorInfos = await dataExtractor.getUserInfos(asArray(post?.author));
  const requesterInfo = post?.request?.user ? await dataExtractor.getUserInfo(post.request.user) : undefined;
  const tagsUsage = await posts?.getTagsUsageStats();

  const usedTags = post?.tags?.map((tag): [string, number] => [tag, tagsUsage?.get(tag) || 0]);

  let locationInfos;
  let worldMapLocationInfo;

  if (post?.location) {
    locationInfos = await dataExtractor.getLocationInfos(post.location);
    worldMapLocationInfo = await dataExtractor.findWorldMapLocationInfo(post.location);
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

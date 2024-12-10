import type { DataExtractor } from '../../../core/entities/data-extractor.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import type { Post } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import type { PostRouteParams } from '../../routes/post-route.js';

export interface PostPageData {
  post: Post | undefined;
  refId: string | undefined;
  authorOptions: Option[] | undefined;
  requesterOption: Option | undefined;
  usedTags: Array<[string, number]> | undefined;
  locationInfos: LocationInfo[] | undefined;
  worldMapLocationInfo: LocationInfo | undefined;
}

export async function getPostPageData(dataExtractor: DataExtractor, params: PostRouteParams): Promise<PostPageData> {
  const manager = dataExtractor.findPostsManager(params.managerName);
  const posts = dataExtractor.findPostsManager('posts');

  const [, post, refId] = params.id ? (await manager?.getEntry(params.id)) || [] : [];
  const authorOptions = await dataExtractor.getUserOptions(asArray(post?.author));
  const [requesterOption] = post?.request?.user ? await dataExtractor.getUserOptions(post.request.user) : [];
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
    authorOptions,
    requesterOption,
    usedTags,
    locationInfos,
    worldMapLocationInfo,
  };
}

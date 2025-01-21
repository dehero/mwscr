import type { DataManager } from '../../../core/entities/data-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { PostContent, PostTitle } from '../../../core/entities/post.js';
import type { Publication } from '../../../core/entities/publication.js';
import type { PostRouteParams } from '../../routes/post-route.js';

export interface PostPageData {
  title: PostTitle | undefined;
  content: PostContent | undefined;
  publications: Publication[] | undefined;
  usedTags: Array<[string, number]> | undefined;
  locationInfos: LocationInfo[] | undefined;
  worldMapLocationInfo: LocationInfo | undefined;
}

export async function getPostPageData(dataManager: DataManager, params: PostRouteParams): Promise<PostPageData> {
  const manager = dataManager.findPostsManager(params.managerName);
  const posts = dataManager.findPostsManager('posts');

  const [, post] = params.id ? (await manager?.getEntry(params.id)) ?? [] : [];

  const publications = post?.posts ?? [];

  const tagsUsage = await posts?.getTagsUsageStats();
  const usedTags = post?.tags?.map((tag): [string, number] => [tag, tagsUsage?.get(tag) || 0]);

  let locationInfos;
  let worldMapLocationInfo;

  if (post?.location) {
    locationInfos = await dataManager.getLocationInfos(post.location);
    worldMapLocationInfo = await dataManager.findWorldMapLocationInfo(post.location);
  }

  return {
    title: post?.title,
    content: post?.content,
    publications,
    usedTags,
    locationInfos,
    worldMapLocationInfo,
  };
}

import { redirect, render } from 'vike/abort';
import type { DataManager } from '../../../core/entities/data-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { PostContent, PostTitle } from '../../../core/entities/post.js';
import type { Publication } from '../../../core/entities/publication.js';
import type { TagInfo } from '../../../core/entities/tag-info.js';
import { postRoute, type PostRouteParams } from '../../routes/post-route.js';

export interface PostPageData {
  title: PostTitle | undefined;
  content: PostContent | undefined;
  repostIds: string[] | undefined;
  publications: Publication[] | undefined;
  tagInfos: TagInfo[] | undefined;
  locationInfos: LocationInfo[] | undefined;
  worldMapLocationInfo: LocationInfo | undefined;
}

export async function getPostPageData(dataManager: DataManager, params: PostRouteParams): Promise<PostPageData> {
  const manager = dataManager.findPostsManager(params.managerName);
  if (!manager) {
    throw render(404);
  }

  const [, post, refId] = params.id ? await manager.getEntry(params.id) : [];
  if (!post) {
    throw render(404);
  }

  if (refId) {
    throw redirect(postRoute.createUrl({ managerName: params.managerName, id: refId, repostId: params.id }));
  }

  const repostIds = (await manager.getAllEntries()).filter((entry) => entry[2] === params.id).map((entry) => entry[0]);

  let tagInfos;
  let locationInfos;
  let worldMapLocationInfo;

  if (post.tags) {
    tagInfos = await dataManager.getTagInfos(post.tags);
  }

  if (post.location) {
    locationInfos = await dataManager.getLocationInfos(post.location);
    worldMapLocationInfo = await dataManager.findWorldMapLocationInfo(post.location);
  }

  return {
    title: post.title,
    content: post.content,
    publications: post.posts,
    repostIds,
    tagInfos,
    locationInfos,
    worldMapLocationInfo,
  };
}

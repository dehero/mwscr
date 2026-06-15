import { query } from '@solidjs/router';
import type { DataManager } from '../../../core/entities/data-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { PostContent, PostTitle } from '../../../core/entities/post.js';
import type { PostsManagerName } from '../../../core/entities/posts-manager.js';
import type { Publication } from '../../../core/entities/publication.js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import type { TagInfo } from '../../../core/entities/tag-info.js';
import { dataManager } from '../../data-managers/manager.js';
import type { PostPageSearchParams } from './PostPage.jsx';

export interface PostPageData {
  title: PostTitle | undefined;
  content: PostContent | undefined;
  repostIds: string[] | undefined;
  publications: Publication[] | undefined;
  tagInfos: TagInfo[] | undefined;
  locationInfos: LocationInfo[] | undefined;
  worldMapLocationInfo: LocationInfo | undefined;
}

export interface PostPageParams extends SiteRouteParams, PostPageSearchParams {
  managerName: PostsManagerName;
  id: string;
}

export async function getPostPageData(
  dataManager: DataManager,
  params: PostPageParams,
): Promise<PostPageData | undefined> {
  const manager = dataManager.findPostsManager(params.managerName);
  if (!manager) {
    return;
  }

  const [, post, , refId] = params.id ? await manager.getEntry(params.id) : [];
  if (!post || refId) {
    return;
  }

  const repostIds = (await manager.getAllEntries()).filter((entry) => entry[3] === params.id).map((entry) => entry[0]);

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

export const queryPostPageData = query(async (params) => getPostPageData(dataManager, params), 'post');

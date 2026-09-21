import { query } from '@solidjs/router';
import type { DataManager } from '../../../core/entities/data-manager.ts';
import type { LocationInfo } from '../../../core/entities/location-info.ts';
import type { PostContent, PostTitle } from '../../../core/entities/post.ts';
import type { PostsManagerName } from '../../../core/entities/posts-manager.ts';
import type { Publication } from '../../../core/entities/publication.ts';
import type { SiteRouteParams } from '../../../core/entities/site-route.ts';
import type { TagInfo } from '../../../core/entities/tag-info.ts';
import { dataManager } from '../../data-managers/manager.ts';
import type { PostPageSearchParams } from './PostPage.tsx';

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

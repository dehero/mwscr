import type { DataManager } from '../../../core/entities/data-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { TagInfo } from '../../../core/entities/tag-info.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import type { PostsRouteParams } from '../../routes/posts-route.js';

export interface PostsPageData {
  authorInfos: UserInfo[];
  requesterInfos: UserInfo[];
  locationInfos: LocationInfo[];
  tagInfos: TagInfo[];
}

export async function getPostsPageData(dataManager: DataManager, params: PostsRouteParams): Promise<PostsPageData> {
  const userInfos = await dataManager.getAllUserInfos();
  const locationInfos = await dataManager.getAllLocationInfos();
  const tagInfos = await dataManager.getAllTagInfos();

  return {
    authorInfos: userInfos.filter((info) => info.authored?.[params.managerName]),
    requesterInfos: userInfos.filter((info) => info.requested?.[params.managerName]),
    locationInfos: locationInfos.filter((info) => info.discovered?.[params.managerName]),
    tagInfos: tagInfos.filter((info) => info.tagged?.[params.managerName]),
  };
}

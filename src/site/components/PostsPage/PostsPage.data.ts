import type { DataManager } from '../../../core/entities/data-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { SelectPostInfosParams } from '../../../core/entities/post-info.js';
import type { PostsManagerName } from '../../../core/entities/posts-manager.js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import type { TagInfo } from '../../../core/entities/tag-info.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { cleanupUndefinedProps, unknownToString } from '../../../core/utils/common-utils.js';
import { dateRangeToString } from '../../../core/utils/date-utils.js';

export interface PostsPageSearchParams {
  type?: string;
  tag?: string;
  location?: string;
  placement?: string;
  author?: string;
  locator?: string;
  requester?: string;
  mark?: string;
  violation?: string;
  publishable?: string;
  original?: string;
  official?: string;
  search?: string;
  sort?: string;
  date?: string;
  status?: string;
  addon?: string;
}

export interface PostsPageParams extends SiteRouteParams, PostsPageSearchParams {
  managerName: PostsManagerName;
}

export interface PostsPageData {
  authorInfos: UserInfo[];
  locatorInfos: UserInfo[];
  requesterInfos: UserInfo[];
  locationInfos: LocationInfo[];
  tagInfos: TagInfo[];
}

export function getPostsPageSearchParamsFromSelectionParams(
  params: SelectPostInfosParams | undefined,
): PostsPageSearchParams | undefined {
  if (!params) {
    return undefined;
  }

  return cleanupUndefinedProps({
    type: unknownToString(params.type),
    tag: unknownToString(params.tag),
    location: unknownToString(params.location),
    placement: unknownToString(params.placement),
    author: unknownToString(params.author),
    locator: unknownToString(params.locator),
    requester: unknownToString(params.requester),
    mark: unknownToString(params.mark),
    violation: unknownToString(params.violation),
    publishable: unknownToString(params.publishable),
    original: unknownToString(params.original),
    official: unknownToString(params.official),
    search: unknownToString(params.search),
    sort:
      params.sortKey || params.sortDirection
        ? unknownToString(`${params.sortKey ?? 'date'},${params.sortDirection ?? 'desc'}`)
        : undefined,
    date: unknownToString(params.date ? dateRangeToString(params.date) : undefined),
    status: unknownToString(params.status),
    addon: unknownToString(params.addon),
  });
}

export async function getPostsPageData(dataManager: DataManager, params: PostsPageParams): Promise<PostsPageData> {
  const userInfos = await dataManager.getAllUserInfos();
  const locationInfos = await dataManager.getAllLocationInfos();
  const tagInfos = await dataManager.getAllTagInfos();

  return {
    authorInfos: userInfos.filter((info) => info.authored?.[params.managerName]),
    locatorInfos: userInfos.filter((info) => info.located?.[params.managerName]),
    requesterInfos: userInfos.filter((info) => info.requested?.[params.managerName]),
    locationInfos: locationInfos.filter((info) => info.discovered?.[params.managerName]),
    tagInfos: tagInfos.filter((info) => info.tagged?.[params.managerName]),
  };
}

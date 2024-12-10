import type { DataExtractor } from '../../../core/entities/data-extractor.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import type { PostInfoSelection } from '../../../core/entities/post-info.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import type { PostsRouteParams } from '../../routes/posts-route.js';

export interface PostsPageData {
  lastPostInfos: PostInfoSelection;
  authorInfos: UserInfo[];
  requesterInfos: UserInfo[];
  locationInfos: LocationInfo[];
  tagOptions: Option[];
}

export async function getPostsPageData(dataExtractor: DataExtractor, params: PostsRouteParams): Promise<PostsPageData> {
  const lastPostInfos = await dataExtractor.selectPostInfos(params.managerName, {}, 18);
  const userInfos = await dataExtractor.getAllUserInfos();
  const locationInfos = await dataExtractor.getAllLocationInfos();
  const tagOptions = await dataExtractor.getTagOptions(params.managerName);

  return {
    lastPostInfos,
    authorInfos: userInfos.filter((info) => info.authored?.[params.managerName]),
    requesterInfos: userInfos.filter((info) => info.requested?.[params.managerName]),
    locationInfos: locationInfos.filter((info) => info.discovered?.[params.managerName]),
    tagOptions,
  };
}

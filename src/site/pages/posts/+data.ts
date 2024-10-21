import type { PageContext } from 'vike/types';
import { POSTS_MANAGER_INFOS } from '../../../core/entities/posts-manager.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import type { PostsPageData } from '../../components/PostsPage/PostsPage.js';

export async function data(pageContext: PageContext): Promise<PostsPageData> {
  const managerName = POSTS_MANAGER_INFOS.find((info) => info.id === pageContext.routeParams?.managerName)?.id;
  if (!managerName) {
    return {
      lastPostInfos: { items: [], params: {}, totalCount: 0 },
      authorInfos: [],
      requesterInfos: [],
      locationInfos: [],
      tagOptions: [],
    };
  }

  const lastPostInfos = await localDataExtractor.selectPostInfos(managerName, {}, 18);
  const userInfos = await localDataExtractor.getAllUserInfos();
  const locationInfos = await localDataExtractor.getAllLocationInfos();
  const tagOptions = await localDataExtractor.getTagOptions(managerName);

  return {
    lastPostInfos,
    authorInfos: userInfos.filter((info) => info.authored?.[managerName]),
    requesterInfos: userInfos.filter((info) => info.requested?.[managerName]),
    locationInfos: locationInfos.filter((info) => info.discovered?.[managerName]),
    tagOptions,
  };
}

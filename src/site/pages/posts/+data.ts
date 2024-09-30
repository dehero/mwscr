import type { PageContext } from 'vike/types';
import { POSTS_MANAGER_INFOS } from '../../../core/entities/posts-manager.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import type { PostsPageData } from '../../components/PostsPage/PostsPage.js';

export async function data(pageContext: PageContext): Promise<PostsPageData> {
  const managerName = POSTS_MANAGER_INFOS.find((info) => info.id === pageContext.routeParams?.managerName)?.id;
  if (!managerName) {
    return { postInfos: [], authorOptions: [], requesterOptions: [], locationInfos: [], tagOptions: [] };
  }

  const postInfos = await localDataExtractor.getAllPostInfos(managerName);
  const authorOptions = await localDataExtractor.getAuthorOptions(managerName);
  const requesterOptions = await localDataExtractor.getRequesterOptions(managerName);
  const locationInfos = await localDataExtractor.getAllLocationInfos();
  const tagOptions = await localDataExtractor.getTagOptions(managerName);

  return {
    postInfos,
    authorOptions,
    requesterOptions,
    locationInfos: locationInfos.filter((info) => info.discovered?.[managerName]),
    tagOptions,
  };
}

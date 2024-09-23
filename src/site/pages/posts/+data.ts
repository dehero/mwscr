import type { PageContext } from 'vike/types';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import type { PostsPageData } from '../../components/PostsPage/PostsPage.js';

export async function data(pageContext: PageContext): Promise<PostsPageData> {
  const managerName = pageContext.routeParams?.managerName;
  if (!managerName) {
    return { postInfos: [], authorOptions: [], requesterOptions: [], locationOptions: [], tagOptions: [] };
  }

  const postInfos = await localDataExtractor.getAllPostInfos(managerName);
  const authorOptions = await localDataExtractor.getAuthorOptions(managerName);
  const requesterOptions = await localDataExtractor.getRequesterOptions(managerName);
  const locationOptions = await localDataExtractor.getLocationOptions(managerName);
  const tagOptions = await localDataExtractor.getTagOptions(managerName);

  return {
    postInfos,
    authorOptions,
    requesterOptions,
    locationOptions,
    tagOptions,
  };
}

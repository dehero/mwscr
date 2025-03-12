import { postRoute } from '../../site/routes/post-route.js';
import { dataManager } from '../data-managers/manager.js';

export async function getConstantRedirects() {
  const redirects: Map<string, string> = new Map();

  const managerName = 'posts';
  const postInfos = await dataManager.getAllPostInfos(managerName);

  postInfos
    .filter((info) => info.refId)
    .forEach((info) =>
      redirects.set(
        postRoute.createUrl({ managerName, id: info.id }),
        postRoute.createUrl({ managerName, id: info.refId!, repostId: info.id }),
      ),
    );

  // TODO: redirect deleted inbox items to trash

  return redirects;
}

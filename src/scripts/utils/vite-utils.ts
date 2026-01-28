import { postRoute } from '../../site/routes/post-route.js';
import { dataManager } from '../data-managers/manager.js';

const contextFile = 'index.pageContext.json';

export async function getConstantRedirects() {
  const redirects: Map<string, string> = new Map();

  for (const managerName of ['posts', 'extras'] as const) {
    const postInfos = await dataManager.getAllPostInfos(managerName);

    postInfos
      .filter((info) => info.refId)
      .forEach((info) => {
        // Redirect page context to referenced page context
        redirects.set(
          `${postRoute.createUrl({ managerName, id: info.id })}${contextFile}`,
          `${postRoute.createUrl({
            managerName,
            id: info.refId!,
          })}${contextFile}`,
        );
        // Redirect page without last slash to referenced page
        redirects.set(
          postRoute.createUrl({ managerName, id: info.id }).replace(/\/$/, ''),
          postRoute.createUrl({
            managerName,
            id: info.refId!,
            repostId: info.id,
          }),
        );
      });
  }

  // TODO: redirect deleted drafts to rejects

  return redirects;
}

import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { asArray } from '../../../core/utils/common-utils.js';
import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import { posts, postsManagers } from '../../../local/data-managers/posts.js';
import type { PostPageData } from '../../components/PostPage/PostPage.js';
import { postRoute } from '../../routes/post-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<PostPageData>> {
  const tagsUsage = await posts.getTagsUsageStats();

  return (
    await Promise.all(
      postsManagers.map(async (manager) => {
        const entries = await manager.getAllEntries();

        return await Promise.all(
          entries.map(async ([id, post, refId]) => ({
            url: postRoute.createUrl({ managerName: manager.name, id }),
            pageContext: {
              data: {
                post,
                refId,
                authorInfos: await localDataExtractor.getUserInfos(asArray(post.author)),
                requesterInfo: post.request?.user ? await localDataExtractor.getUserInfo(post.request.user) : undefined,
                usedTags: post.tags?.map((tag): [string, number] => [tag, tagsUsage.get(tag) || 0]),
                locationInfos: post.location ? await localDataExtractor.getLocationInfos(post.location) : undefined,
                worldMapLocationInfo: post.location
                  ? await localDataExtractor.findWorldMapLocationInfo(post.location)
                  : undefined,
              },
            },
          })),
        );
      }),
    )
  ).flatMap((value) => value);
}

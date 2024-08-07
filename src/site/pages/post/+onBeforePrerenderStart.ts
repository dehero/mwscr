import type { OnBeforePrerenderStartAsync } from 'vike/types';
import { asArray } from '../../../core/utils/common-utils.js';
import { posts, postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { PostPageData } from '../../components/PostPage/PostPage.js';
import { postRoute } from '../../routes/post-route.js';

export async function onBeforePrerenderStart(): ReturnType<OnBeforePrerenderStartAsync<PostPageData>> {
  const tagsUsage = await posts.getUsedTags();

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
                authorEntries: await users.getEntries(asArray(post.author)),
                requesterEntry: post.request?.user ? await users.getEntry(post.request.user) : undefined,
                usedTags: post.tags?.map((tag): [string, number] => [tag, tagsUsage.get(tag) || 0]),
              },
            },
          })),
        );
      }),
    )
  ).flatMap((value) => value);
}

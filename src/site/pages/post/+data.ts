import type { PageContext } from 'vike/types';
import { asArray } from '../../../core/utils/common-utils.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { PostPageData } from '../../components/PostPage/PostPage.js';

export async function data(pageContext: PageContext): Promise<PostPageData> {
  const manager = postsManagers.find((manager) => manager.name === pageContext.routeParams?.managerName);

  const [, post, refId] = pageContext.routeParams?.id
    ? (await manager?.getEntry(pageContext.routeParams.id)) || []
    : [];
  const authorEntries = await users.getEntries(asArray(post?.author));

  return {
    post,
    refId,
    authorEntries,
  };
}

import type { PageContext } from 'vike/types';
import { createPostInfo } from '../../../core/entities/post-info.js';
import { locations } from '../../../local/data-managers/locations.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { PostsPageData } from '../../components/PostsPage/PostsPage.js';
import {
  getAuthorOptions,
  getLocationOptions,
  getRequesterOptions,
  getTagOptions,
} from '../../data-utils/post-infos.js';

export async function data(pageContext: PageContext): Promise<PostsPageData> {
  const manager = postsManagers.find((manager) => manager.name === pageContext.routeParams?.managerName);
  if (!manager) {
    return { postInfos: [], authorOptions: [], requesterOptions: [], locationOptions: [], tagOptions: [] };
  }

  const postInfos = await Promise.all(
    (await manager.getAllEntries()).map((entry) => createPostInfo(entry, locations, users, manager.name)),
  );
  const authorOptions = await getAuthorOptions(manager, users);
  const requesterOptions = await getRequesterOptions(manager, users);
  const locationOptions = await getLocationOptions(manager, locations);
  const tagOptions = await getTagOptions(manager);

  return {
    postInfos,
    authorOptions,
    requesterOptions,
    locationOptions,
    tagOptions,
  };
}

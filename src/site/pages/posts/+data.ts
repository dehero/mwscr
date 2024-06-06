import type { PageContext } from 'vike/types';
import { isNestedLocation } from '../../../core/entities/location.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostInfo } from '../../../core/entities/post-info.js';
import type { PostsManager } from '../../../core/entities/posts-manager.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { locations } from '../../../local/data-managers/locations.js';
import { postsManagers } from '../../../local/data-managers/posts.js';
import { users } from '../../../local/data-managers/users.js';
import type { SelectOption } from '../../components/Select/Select.js';

export interface PostsPageData {
  postInfos: PostInfo[];
  authorOptions: SelectOption<string>[];
  locationOptions: SelectOption<string>[];
  tagOptions: SelectOption<string>[];
}

export const getTagOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedTags = await postsManager.getUsedTags();

  return [...usedTags]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: `${value} (${count})` }));
};

export const getLocationOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedLocationIds = await postsManager.getUsedLocationIds();
  const usedLocationsWithNesting = new Map();

  for await (const [location] of locations.readAllEntries(true)) {
    const count = [...usedLocationIds]
      .filter(([value]) => isNestedLocation(value, location))
      .reduce((acc, [, count]) => acc + count, 0);

    if (count > 0) {
      usedLocationsWithNesting.set(location, count);
    }
  }

  return [...usedLocationsWithNesting]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: `${value} (${count})` }));
};

export const getAuthorOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedAuthorIds = await postsManager.getUsedAuthorIds();
  const authors = await users.getEntries([...usedAuthorIds.keys()]);

  return authors
    .map((entry) => ({ value: entry[0], label: `${getUserEntryTitle(entry)} (${usedAuthorIds.get(entry[0])})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export async function data(pageContext: PageContext): Promise<PostsPageData> {
  const manager = postsManagers.find((manager) => manager.name === pageContext.routeParams?.managerName);
  if (!manager) {
    return { postInfos: [], authorOptions: [], locationOptions: [], tagOptions: [] };
  }

  const postInfos = await Promise.all(
    (await manager.getAllEntries()).map((entry) => createPostInfo(entry, locations, users, manager.name)),
  );
  const authorOptions = await getAuthorOptions(manager);
  const locationOptions = await getLocationOptions(manager);
  const tagOptions = await getTagOptions(manager);

  return {
    postInfos,
    authorOptions,
    locationOptions,
    tagOptions,
  };
}

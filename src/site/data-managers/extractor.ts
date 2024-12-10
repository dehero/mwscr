import { DataExtractor } from '../../core/entities/data-extractor.js';
// import type { LocationInfo } from '../../core/entities/location-info.js';
// import type { PostInfo } from '../../core/entities/post-info.js';
// import type { PostsManagerName } from '../../core/entities/posts-manager.js';
// import type { UserInfo } from '../../core/entities/user-info.js';
import { locations } from './locations.js';
import { postsManagers } from './posts.js';
import { users } from './users.js';

class SiteDataExtractor extends DataExtractor {
  // async getAllLocationInfos(): Promise<LocationInfo[]> {
  //   return (await import('virtual:locationInfos')).default;
  // }
  // async getAllPostInfos(managerName: PostsManagerName): Promise<PostInfo[]> {
  //   // Cannot use `virtual:postInfos?managerName=${managerName}`
  //   // See https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  //   switch (managerName) {
  //     case 'posts':
  //       return (await import('virtual:postInfos?managerName=posts')).default;
  //     case 'inbox':
  //       return (await import('virtual:postInfos?managerName=inbox')).default;
  //     case 'trash':
  //       return (await import('virtual:postInfos?managerName=trash')).default;
  //     default:
  //       throw new Error(`Cannot find posts manager "${managerName}"`);
  //   }
  // }
  // async getAllUserInfos(): Promise<UserInfo[]> {
  //   return (await import('virtual:userInfos')).default;
  // }
}

export const dataExtractor = new SiteDataExtractor({
  postsManagers,
  locations,
  users,
});

import { arrayFromAsync, asArray } from '../utils/common-utils.js';
import { isNestedLocation } from './location.js';
import type { LocationInfo } from './location-info.js';
import { createLocationInfo } from './location-info.js';
import type { LocationsReader } from './locations-reader.js';
import type { Option } from './option.js';
import type { PostLocation } from './post.js';
import { comparePostEntriesByDate, getPostEntriesFromSource } from './post.js';
import type { PostInfo, PostInfoSelection, SelectPostInfosParams } from './post-info.js';
import { createPostInfo, selectPostInfos } from './post-info.js';
import type { PostsManager, PostsManagerName } from './posts-manager.js';
// import { getUserEntryTitle } from './user.js';
import type { SelectUserInfosParams, UserInfo } from './user-info.js';
import { createUserInfo, selectUserInfos } from './user-info.js';
import type { UsersManager } from './users-manager.js';

export interface DataExtractorArgs {
  postsManagers: PostsManager[];
  locations: LocationsReader;
  users: UsersManager;
}

export class DataExtractor {
  protected readonly postsManagers: PostsManager[];
  protected readonly locations: LocationsReader;
  protected readonly users: UsersManager;

  protected cache: Record<string, unknown> = {};

  protected async createCache<T>(key: string, creator: () => Promise<T>): Promise<T> {
    if (!this.cache[key]) {
      this.cache[key] = creator();
    }
    return this.cache[key] as T;
  }

  protected clearCache() {
    this.cache = {};
  }

  constructor(args: DataExtractorArgs) {
    this.postsManagers = args.postsManagers;
    this.locations = args.locations;
    this.users = args.users;
  }

  async findWorldMapLocationInfo(location: PostLocation): Promise<LocationInfo | undefined> {
    const locations = asArray(location);
    const allLocationInfos = await this.getAllLocationInfos();
    const locationInfos = allLocationInfos.filter((info) => locations.includes(info.title));

    if (locationInfos.length === 0) {
      return undefined;
    }

    for (const locationInfo of locationInfos) {
      if (!locationInfo.cell) {
        const result = locationInfos.find((info) => info.cell && isNestedLocation(locationInfo.title, info.title));
        if (result) {
          return result;
        }
      } else {
        return locationInfo;
      }
    }

    return undefined;
  }

  findPostsManager(managerName: string): PostsManager | undefined {
    return this.postsManagers.find((manager) => manager.name === managerName);
  }

  async getAllPostInfos(managerName: PostsManagerName): Promise<PostInfo[]> {
    return this.createCache(`${this.getAllPostInfos.name}.${managerName}`, async () => {
      const manager = this.findPostsManager(managerName);
      if (!manager) {
        throw new Error(`Cannot find posts manager "${managerName}"`);
      }
      const entries = await getPostEntriesFromSource(
        () => manager.readAllEntries(false),
        comparePostEntriesByDate('desc'),
      );

      return await Promise.all(entries.map((entry) => createPostInfo(entry, this.users, managerName)));
    });
  }

  async getAllLocationInfos(): Promise<LocationInfo[]> {
    return this.createCache(this.getAllLocationInfos.name, async () => {
      const entries = await arrayFromAsync(this.locations.readAllEntries());

      return await Promise.all(entries.map((entry) => createLocationInfo(entry, this.postsManagers)));
    });
  }

  async getAllUserInfos(): Promise<UserInfo[]> {
    return this.createCache(this.getAllUserInfos.name, async () => {
      const entries = await arrayFromAsync(this.users.readAllEntries());

      return await Promise.all(entries.map((entry) => createUserInfo(entry, this.postsManagers)));
    });
  }

  async getTagOptions(managerName: string): Promise<Option<string>[]> {
    const manager = this.findPostsManager(managerName);
    if (!manager) {
      throw new Error(`Cannot find posts manager "${managerName}"`);
    }

    const usedTags = await manager.getTagsUsageStats();

    return [...usedTags]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({ value, label: `${value} (${count})` }));
  }

  async getLocationInfos(id: string | string[]): Promise<LocationInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    return (await this.getAllLocationInfos()).filter((info) => ids.has(info.title));
  }

  async getLocationInfo(id: string) {
    return (await this.getAllLocationInfos()).find((info) => info.title === id);
  }

  async getUserInfos(id: string | string[]): Promise<UserInfo[] | undefined> {
    const ids = new Set(asArray(id));

    if (ids.size === 0) {
      return undefined;
    }

    const infos = new Map(
      (await this.getAllUserInfos()).filter((info) => ids.has(info.id)).map((info) => [info.id, info]),
    );

    return [...ids].map((id) => infos.get(id)).filter((info): info is UserInfo => typeof info !== 'undefined');
  }

  async getUserInfo(id: string) {
    return (await this.getAllUserInfos()).find((info) => info.id === id);
  }

  async selectPostInfo(
    managerName: PostsManagerName,
    params: SelectPostInfosParams,
  ): Promise<PostInfoSelection | undefined> {
    const result = await this.selectPostInfos(managerName, params, 1);

    return result.totalCount > 0 ? result : undefined;
  }

  async selectPostInfos(
    managerName: PostsManagerName,
    params: SelectPostInfosParams,
    limit?: number,
  ): Promise<PostInfoSelection> {
    const postInfos = await this.getAllPostInfos(managerName);

    return selectPostInfos(postInfos, params, limit);
  }

  async selectUserInfos(params: SelectUserInfosParams, limit?: number) {
    const userInfos = await this.getAllUserInfos();

    return selectUserInfos(userInfos, params, limit);
  }
}

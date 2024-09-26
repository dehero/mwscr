import { arrayFromAsync } from '../utils/common-utils.js';
import { isNestedLocation } from './location.js';
import type { LocationInfo } from './location-info.js';
import { createLocationInfo } from './location-info.js';
import type { LocationsReader } from './locations-reader.js';
import type { Option } from './option.js';
import { comparePostEntriesByDate, getPostEntriesFromSource } from './post.js';
import type { PostInfo, SelectPostInfosParams } from './post-info.js';
import { createPostInfo, selectPostInfos } from './post-info.js';
import type { PostsManager, PostsManagerName } from './posts-manager.js';
import { getUserEntryTitle } from './user.js';
import type { UserInfo } from './user-info.js';
import { createUserInfo } from './user-info.js';
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
      this.cache[key] = await creator();
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

  async findWorldMapLocationInfo(location: string): Promise<LocationInfo | undefined> {
    const locationInfos = await this.getAllLocationInfos();
    const locationInfo = locationInfos.find((info) => info.title === location);

    if (!locationInfo) {
      return undefined;
    }

    if (!locationInfo?.cell) {
      return locationInfos.find((info) => info.cell && isNestedLocation(locationInfo.title, info.title));
    } else {
      return locationInfo;
    }
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

  async getLocationOptions(managerName: string): Promise<Option<string>[]> {
    const manager = this.findPostsManager(managerName);
    if (!manager) {
      throw new Error(`Cannot find posts manager "${managerName}"`);
    }

    const usedLocationIds = await manager.getLocationsUsageStats();
    const usedLocationsWithNesting = new Map();

    for await (const [location] of this.locations.readAllEntries(true)) {
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
  }

  async getAuthorOptions(managerName: string): Promise<Option<string>[]> {
    const manager = this.findPostsManager(managerName);
    if (!manager) {
      throw new Error(`Cannot find posts manager "${managerName}"`);
    }

    const usedAuthorIds = await manager.getAuthorsUsageStats();
    const authors = await this.users.getEntries([...usedAuthorIds.keys()]);

    return authors
      .map((entry) => ({ value: entry[0], label: `${getUserEntryTitle(entry)} (${usedAuthorIds.get(entry[0])})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async getRequesterOptions(managerName: string): Promise<Option<string>[]> {
    const manager = this.findPostsManager(managerName);
    if (!manager) {
      throw new Error(`Cannot find posts manager "${managerName}"`);
    }

    const usedRequesterIds = await manager.getRequesterUsageStats();
    const requesters = await this.users.getEntries([...usedRequesterIds.keys()]);

    return requesters
      .map((entry) => ({ value: entry[0], label: `${getUserEntryTitle(entry)} (${usedRequesterIds.get(entry[0])})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
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

  async getLocationInfo(id: string) {
    return (await this.getAllLocationInfos()).find((info) => info.title === id);
  }

  async getUserInfo(id: string) {
    return (await this.getAllUserInfos()).find((info) => info.id === id);
  }

  async selectPostInfo(managerName: PostsManagerName, params: SelectPostInfosParams): Promise<PostInfo | undefined> {
    const [postInfo] = await this.selectPostInfos(managerName, params, 1);

    return postInfo;
  }

  async selectPostInfos(
    managerName: PostsManagerName,
    params: SelectPostInfosParams,
    size?: number,
  ): Promise<PostInfo[]> {
    const postInfos = await this.getAllPostInfos(managerName);
    const result = selectPostInfos(postInfos, params);

    return typeof size === 'undefined' ? result : result.slice(0, size);
  }
}

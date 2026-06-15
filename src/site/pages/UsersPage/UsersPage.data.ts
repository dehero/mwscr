import { query } from '@solidjs/router';
import type { DataManager } from '../../../core/entities/data-manager.js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UsersPageData {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UsersPageParams extends SiteRouteParams {}

export async function getUsersPageData(
  _dataManager: DataManager,
  _usersPageParams: UsersPageParams,
): Promise<UsersPageData> {
  return {};
}

export const queryUsersPageData = query(async (params) => getUsersPageData(dataManager, params), 'users');

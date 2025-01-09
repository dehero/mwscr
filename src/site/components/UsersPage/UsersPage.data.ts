import type { DataManager } from '../../../core/entities/data-manager.js';
import type { UserInfoSelection } from '../../../core/entities/user-info.js';

export interface UsersPageData {
  firstUserInfos: UserInfoSelection;
}

export async function getUsersPageData(dataManager: DataManager): Promise<UsersPageData> {
  const firstUserInfos = await dataManager.selectUserInfos({}, 18);

  return {
    firstUserInfos,
  };
}

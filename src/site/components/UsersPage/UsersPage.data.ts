import type { DataExtractor } from '../../../core/entities/data-extractor.js';
import type { UserInfoSelection } from '../../../core/entities/user-info.js';

export interface UsersPageData {
  firstUserInfos: UserInfoSelection;
}

export async function getUsersPageData(dataExtractor: DataExtractor): Promise<UsersPageData> {
  const firstUserInfos = await dataExtractor.selectUserInfos({}, 18);

  return {
    firstUserInfos,
  };
}

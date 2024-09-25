import { localDataExtractor } from '../../../local/data-managers/extractor.js';
import type { UsersPageData } from '../../components/UsersPage/UsersPage.js';

export async function data(): Promise<UsersPageData> {
  const userInfos = await localDataExtractor.getAllUserInfos();

  return {
    userInfos,
  };
}

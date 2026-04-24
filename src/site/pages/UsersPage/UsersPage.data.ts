import type { DataManager } from '../../../core/entities/data-manager.js';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UsersPageData {}

export async function getUsersPageData(_dataManager: DataManager): Promise<UsersPageData> {
  return {};
}

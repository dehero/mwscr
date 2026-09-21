import { query } from '@solidjs/router';
import type { DataManager, DataSummary } from '../../../core/entities/data-manager.ts';
import { dataManager } from '../../data-managers/manager.ts';

export type HomePageData = DataSummary;

export async function getHomePageData(dataManager: DataManager): Promise<DataSummary> {
  return dataManager.getSummary();
}

export const queryHomePageData = query(async () => getHomePageData(dataManager), 'home');

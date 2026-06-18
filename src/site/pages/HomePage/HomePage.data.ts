import { query } from '@solidjs/router';
import type { DataManager, DataSummary } from '../../../core/entities/data-manager.js';
import { dataManager } from '../../data-managers/manager.js';

export type HomePageData = DataSummary;

export async function getHomePageData(dataManager: DataManager): Promise<DataSummary> {
  return dataManager.getSummary();
}

export const queryHomePageData = query(async () => getHomePageData(dataManager), 'home');

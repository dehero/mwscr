import { query } from '@solidjs/router';
import type { DataManager } from '../../../core/entities/data-manager.ts';
import type { LocationInfo } from '../../../core/entities/location-info.ts';
import { dataManager } from '../../data-managers/manager.ts';

export interface LocationsPageData {
  locationInfos: LocationInfo[];
}

export async function getLocationsPageData(dataManager: DataManager): Promise<LocationsPageData> {
  return {
    locationInfos: await dataManager.getAllLocationInfos(),
  };
}

export const queryLocationsPageData = query(async () => getLocationsPageData(dataManager), 'locations');

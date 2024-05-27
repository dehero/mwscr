import type { Location, LocationType } from './location.js';

export interface LocationInfo {
  title: string;
  type: LocationType;
}

export function createLocationInfo(location: Location): LocationInfo {
  return {
    title: location.title,
    type: location.type,
  };
}

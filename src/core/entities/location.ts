import type { PostAddon } from './post.js';

export type LocationCell = `${number} ${number}`;

export const LOCATION_TYPES = ['interior', 'exterior', 'region', 'virtual'] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export interface Location {
  title: string;
  titleRu?: string;
  type: LocationType;
  addon?: PostAddon;
  cell?: LocationCell | LocationCell[];
}

export function areNestedLocations(location1: string, location2: string) {
  return location1.startsWith(location2) || location2.startsWith(location1);
}

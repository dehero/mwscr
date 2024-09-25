import { asArray } from '../utils/common-utils.js';
import type { PostAddon } from './post.js';

export type LocationCell = `${number} ${number}`;

export type LocationCellCoordinates = [number, number];

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
  return isNestedLocation(location1, location2) || isNestedLocation(location2, location1);
}

export function isNestedLocation(location1: string, location2: string) {
  return location1.startsWith(location2);
}

export function getLocationCellCoordinates(cell: string): LocationCellCoordinates {
  return cell.split(' ').map(Number) as LocationCellCoordinates;
}

export function locationCellsToString(cell: LocationCell | LocationCell[] | undefined): string {
  return asArray(cell).join(' ');
}

export function stringToLocationCells(cells: string | undefined): LocationCell[] {
  return (
    cells
      ?.split(' ')
      .map((item) => Number(item) || 0)
      .reduce(
        (result, _, index, array) => {
          if (index % 2 === 0) result.push(array.slice(index, index + 2));
          return result;
        },
        [] as Array<number[]>,
      )
      .map(([x, y]) => `${x} ${y}` as LocationCell) ?? []
  );
}

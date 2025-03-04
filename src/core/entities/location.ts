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

export function locationMatchesString(a: Location, searchString: string): boolean {
  const lowerCaseSearchString = searchString.trim().toLocaleLowerCase();

  return (
    a.title.toLocaleLowerCase() === lowerCaseSearchString || a.titleRu?.toLocaleLowerCase() === lowerCaseSearchString
  );
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

export function getCenterLocationCell(cell: LocationCell | LocationCell[] | undefined): LocationCell | undefined {
  const cells = asArray(cell);
  if (cells.length === 0) {
    return undefined;
  }
  if (cells.length === 1) {
    return cells[0];
  }

  const coordinates = cells.map((cell) => getLocationCellCoordinates(cell));

  const minX = Math.min(...coordinates.map(([x]) => x));
  const maxX = Math.max(...coordinates.map(([x]) => x));
  const minY = Math.min(...coordinates.map(([_, y]) => y));
  const maxY = Math.max(...coordinates.map(([_, y]) => y));

  return `${minX + Math.round((maxX - minX) / 2)} ${minY + Math.round((maxY - minY) / 2)}`;
}

import { BooleanOperations, Box, Polygon } from '@flatten-js/core';
import { asArray } from '../utils/common-utils.js';
import type { LocationCell } from './location.js';
import { getLocationCellCoordinates } from './location.js';

export const WORLD_MAP_CELL_SIZE = 18;
export const WORLD_MAP_CELL_SHIFT_X = 522;
export const WORLD_MAP_CELL_SHIFT_Y = 504;
export const WORLD_MAP_WIDTH = 954;
export const WORLD_MAP_HEIGHT = 854;

export function worldMapPositionToLocationCell(x: number, y: number): LocationCell {
  return `${Math.floor((x - WORLD_MAP_CELL_SHIFT_X) / WORLD_MAP_CELL_SIZE)} ${
    Math.floor((WORLD_MAP_CELL_SHIFT_Y - y) / WORLD_MAP_CELL_SIZE) + 1
  }`;
}

export function locationCellToWorldMapPosition(cell: LocationCell) {
  const [x, y] = getLocationCellCoordinates(cell);

  return [WORLD_MAP_CELL_SHIFT_X + x * WORLD_MAP_CELL_SIZE, WORLD_MAP_CELL_SHIFT_Y - y * WORLD_MAP_CELL_SIZE];
}

export function locationCellToWorldMapPolygon(cell: LocationCell | LocationCell[] | undefined) {
  const cells = asArray(cell);
  if (cells.length === 0) {
    return;
  }

  const cellPolygons = cells.map((cell) => {
    const [x = 0, y = 0] = locationCellToWorldMapPosition(cell);

    return new Polygon(new Box(x, y, x + WORLD_MAP_CELL_SIZE, y + WORLD_MAP_CELL_SIZE));
  });

  let polygon;
  for (const cell of cellPolygons) {
    if (!polygon) {
      polygon = cell;
    } else {
      polygon = BooleanOperations.unify(polygon, cell);
    }
  }

  return polygon;
}

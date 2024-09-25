import { BooleanOperations, Box, Polygon } from '@flatten-js/core';
import clsx from 'clsx';
import {
  batch,
  type Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  untrack,
} from 'solid-js';
import {
  getLocationCellCoordinates,
  type LocationCell,
  stringToLocationCells,
} from '../../../core/entities/location.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import styles from './WorldMap.module.css';

const CELL_SIZE = 18;
const CELL_SHIFT_X = 522;
const CELL_SHIFT_Y = 504;

export interface WorldMapProps {
  locations: LocationInfo[];
  class?: string;
  onCurrentLocationChange?: (location: string | undefined) => void;
  currentLocation?: string;
  discoveredLocations?: string[];
}

interface CellMarkerProps {
  cell: LocationCell;
  ref?: HTMLDivElement | undefined;
}

interface WorldMapContext {
  onLocationClick?: (location: LocationInfo) => void;
}

function mapPositionToCell(x: number, y: number): LocationCell {
  return `${Math.floor((x - CELL_SHIFT_X) / CELL_SIZE)} ${Math.floor((CELL_SHIFT_Y - y) / CELL_SIZE) + 1}`;
}

function cellToMapPosition(cell: LocationCell) {
  const [x, y] = getLocationCellCoordinates(cell);

  return [CELL_SHIFT_X + x * CELL_SIZE, CELL_SHIFT_Y - y * CELL_SIZE];
}

function locationToMapPolygon(info: LocationInfo) {
  const cells = stringToLocationCells(info.cells).map((cell) => {
    const [x = 0, y = 0] = cellToMapPosition(cell);

    return new Polygon(new Box(x, y, x + CELL_SIZE, y + CELL_SIZE));
  });

  let polygon;
  for (const cell of cells) {
    if (!polygon) {
      polygon = cell;
    } else {
      polygon = BooleanOperations.unify(polygon, cell);
    }
  }

  return polygon;
}

function locationToCenterCell(info: LocationInfo): LocationCell {
  const coordinates = stringToLocationCells(info.cells).map((cell) => getLocationCellCoordinates(cell));

  const minX = Math.min(...coordinates.map(([x]) => x));
  const maxX = Math.max(...coordinates.map(([x]) => x));
  const minY = Math.min(...coordinates.map(([_, y]) => y));
  const maxY = Math.max(...coordinates.map(([_, y]) => y));

  return `${minX + Math.round((maxX - minX) / 2)} ${minY + Math.round((maxY - minY) / 2)}`;
}

const WorldMapContext = createContext<WorldMapContext>({
  onLocationClick: undefined,
});

const CellMarker: Component<CellMarkerProps> = (props) => {
  const style = () => {
    const [left, top] = cellToMapPosition(props.cell).map((v) => `${v - 0.5}px`);
    return {
      left,
      top,
    };
  };

  return <div class={clsx(styles.cellMarker)} style={style()} />;
};

const Compass: Component<CellMarkerProps> = (props) => {
  const style = () => {
    const [left, top] = cellToMapPosition(props.cell).map((v) => `${v}px`);
    return {
      left,
      top,
    };
  };

  return <div class={clsx(styles.compass)} style={style()} ref={props.ref} />;
};

export const WorldMap: Component<WorldMapProps> = (props) => {
  const [grabStartPosition, setGrabStartPosition] = createSignal<{
    scrollLeft: number;
    scrollTop: number;
    x: number;
    y: number;
  } | null>(null);
  const [isGrabbing, setIsGrabbing] = createSignal(false);

  const worldLocations = createMemo(() => props.locations.filter((location) => location.cells));
  const exteriors = createMemo(() => worldLocations().filter((location) => location.type === 'exterior'));

  const cellLocations = createMemo(() => {
    const result = new Map(
      worldLocations().flatMap((location) => stringToLocationCells(location.cells).map((cell) => [cell, location])),
    );
    return result;
  });

  const locationPolygons = createMemo(() =>
    worldLocations().map((location): [string, Polygon | undefined] => [location.title, locationToMapPolygon(location)]),
  );

  const discoveredPolygons = createMemo(() =>
    locationPolygons().filter(([location]) => props.discoveredLocations?.includes(location)),
  );

  const selectedWorldLocation = () => {
    if (props.currentLocation) {
      return worldLocations().find((location) => location.title === props.currentLocation);
    }
    return undefined;
  };

  const [currentCell, setCurrentCell] = createSignal<LocationCell | null>(null);

  let ref: HTMLDivElement | undefined;
  let mapRef: HTMLDivElement | undefined;
  let compassRef: HTMLDivElement | undefined;

  const handleMapMouseUp = (e: MouseEvent) => {
    if (isGrabbing()) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const cell = mapPositionToCell(e.offsetX, e.offsetY);
    const location = cellLocations().get(cell);

    batch(() => {
      if (location) {
        setCurrentCell(cell);
      } else {
        setCurrentCell(null);
      }
      props.onCurrentLocationChange?.(location?.title);
    });
  };

  createEffect(() => {
    if (mapRef) {
      mapRef.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center',
      });
    }
  });

  createEffect(() => {
    const cell = currentCell();
    if (compassRef && cell) {
      compassRef.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  });

  createEffect(() => {
    const selectedLocation = selectedWorldLocation();
    const currentLocation = untrack(() => (currentCell() ? cellLocations().get(currentCell()!) : undefined));

    if (selectedLocation) {
      if (selectedLocation.title !== currentLocation?.title) {
        const centerCell = locationToCenterCell(selectedLocation);
        setCurrentCell(centerCell);
      }
    } else {
      setCurrentCell(null);
    }
  });

  const handleMouseDown = (e: MouseEvent) => {
    if (ref) {
      e.preventDefault();
      setGrabStartPosition({ scrollLeft: ref.scrollLeft, scrollTop: ref.scrollTop, x: e.pageX, y: e.pageY });
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('mousemove', handleDocumentMouseMove);
    }
  };

  const handleDocumentMouseUp = () => {
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    setGrabStartPosition(null);
    setIsGrabbing(false);
  };

  const handleDocumentMouseMove = (e: MouseEvent) => {
    const startPosition = grabStartPosition();

    if (ref && startPosition) {
      e.preventDefault();
      ref.scrollLeft = startPosition.scrollLeft + startPosition.x - e.pageX;
      ref.scrollTop = startPosition.scrollTop + startPosition.y - e.pageY;
      setIsGrabbing(Math.abs(startPosition.x - e.pageX) > 5 || Math.abs(startPosition.y - e.pageY) > 5);
    }
  };

  onCleanup(() => {
    if (grabStartPosition()) {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
    }
  });

  return (
    <>
      <div
        class={clsx(styles.container, isGrabbing() && styles.grabbing, props.class)}
        ref={ref}
        onMouseDown={handleMouseDown}
      >
        <div class={styles.map} ref={mapRef} onMouseUp={handleMapMouseUp}>
          <Show when={discoveredPolygons().length > 0}>
            <div class={styles.discovered} />
            <svg width="954" height="854" viewBox="0 0 954 854">
              <defs>
                <clipPath
                  id="discoveredSvgPath"
                  innerHTML={discoveredPolygons()
                    .map(
                      ([_, polygon]) =>
                        polygon?.svg({
                          className: styles.discoveredPolygon,
                        }),
                    )
                    .join('\n')}
                />
              </defs>
            </svg>
          </Show>
          <For each={exteriors()}>
            {(exterior) => (
              <For each={stringToLocationCells(exterior.cells)}>{(cell) => <CellMarker cell={cell} />}</For>
            )}
          </For>
          <Show when={currentCell()}>{(cell) => <Compass cell={cell()} ref={compassRef} />}</Show>
        </div>
      </div>
      <LocationTooltip
        forRef={ref}
        location={(relative) => {
          if (isGrabbing()) {
            return;
          }
          const cell = mapPositionToCell(relative.x + (ref?.scrollLeft || 0), relative.y + (ref?.scrollTop || 0));
          return cellLocations().get(cell);
        }}
      />
    </>
  );
};

import clsx from 'clsx';
import { batch, type Component, createEffect, createMemo, createSignal, For, onCleanup, Show, untrack } from 'solid-js';
import { getCenterLocationCell, type LocationCell } from '../../../core/entities/location.js';
import { type LocationInfo } from '../../../core/entities/location-info.js';
import {
  locationCellToWorldMapPosition,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  worldMapPositionToLocationCell,
} from '../../../core/entities/world-map.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Button } from '../Button/Button.js';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import { Spacer } from '../Spacer/Spacer.jsx';
import styles from './WorldMap.module.css';

export interface WorldMapProps {
  locations: LocationInfo[];
  class?: string;
  onSelectLocation?: (location: string | undefined) => void;
  currentLocation?: string;
  discoveredLocations?: string[];
  readonly?: boolean;
}

interface CellMarkerProps {
  cell: LocationCell;
  ref?: HTMLDivElement | undefined;
}

const CellMarker: Component<CellMarkerProps> = (props) => {
  const style = () => {
    const [left, top] = locationCellToWorldMapPosition(props.cell).map((v) => `${v - 0.5}px`);
    return {
      left,
      top,
    };
  };

  return <div class={clsx(styles.cellMarker)} style={style()} />;
};

const Compass: Component<CellMarkerProps> = (props) => {
  const style = () => {
    const [left, top] = locationCellToWorldMapPosition(props.cell).map((v) => `${v}px`);
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

  const worldLocations = createMemo(() => props.locations.filter((location) => location.cell));

  const markedCells = createMemo(() =>
    worldLocations()
      .filter((location) => location.type === 'exterior')
      .flatMap((exterior) => asArray(exterior.cell)),
  );

  const cellLocations = createMemo(() => {
    const result = new Map(
      worldLocations().flatMap((location) => asArray(location.cell).map((cell) => [cell, location])),
    );
    return result;
  });

  const discoveredPolygonSvgs = createMemo(() =>
    worldLocations()
      .filter((info) => props.discoveredLocations?.includes(info.title))
      .map((info) => info.worldMapSvg),
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

  const handleMapMouseUp = (e: MouseEvent) => {
    if (isGrabbing() || !props.onSelectLocation) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const cell = worldMapPositionToLocationCell(e.offsetX, e.offsetY);
    const location = cellLocations().get(cell);

    batch(() => {
      if (!props.readonly) {
        if (location) {
          setCurrentCell(cell);
        } else {
          setCurrentCell(null);
        }
      }

      props.onSelectLocation?.(location?.title);
    });
  };

  createEffect(() => {
    if (ref) {
      ref.scrollTo({
        left: Math.floor(WORLD_MAP_WIDTH / 2 - ref.clientWidth / 2),
        top: Math.floor(WORLD_MAP_HEIGHT / 2 - ref.clientHeight / 2),
        behavior: 'auto',
      });
    }
  });

  createEffect(() => {
    const cell = currentCell();
    const [left, top] = cell ? locationCellToWorldMapPosition(cell) : [];
    if (ref && left && top) {
      ref.scrollTo({
        left: left - Math.floor(ref.clientWidth / 2),
        top: top - Math.floor(ref.clientHeight / 2),
        behavior: 'smooth',
      });
    }
  });

  createEffect(() => {
    const selectedLocation = selectedWorldLocation();
    const currentLocation = untrack(() => (currentCell() ? cellLocations().get(currentCell()!) : undefined));

    if (selectedLocation) {
      if (selectedLocation.title !== currentLocation?.title) {
        const centerCell = getCenterLocationCell(selectedLocation.cell);
        if (centerCell) {
          setCurrentCell(centerCell);
        }
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
          <Show when={discoveredPolygonSvgs().length > 0}>
            <div class={styles.discovered} />
            <svg
              width={WORLD_MAP_WIDTH}
              height={WORLD_MAP_HEIGHT}
              viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
            >
              <defs>
                <clipPath id="discoveredSvgPath" innerHTML={discoveredPolygonSvgs().join('\n')} />
              </defs>
            </svg>
          </Show>
          <For each={markedCells()}>{(cell) => <CellMarker cell={cell} />}</For>
          <Show when={currentCell()}>{(cell) => <Compass cell={cell()} />}</Show>
        </div>
        <p class={styles.footer}>
          <Show when={props.locations.length > 1 && worldLocations().length < props.locations.length}>
            <span class={styles.worldLocationCount}>
              Showing {worldLocations().length} of {props.locations.length} locations
            </span>
          </Show>
          <Show when={props.currentLocation}>
            <Spacer component="span" />
            <span class={styles.currentLocationTitle}>{props.currentLocation}</span>
            <Show when={!props.readonly}>
              <Button
                class={styles.resetButton}
                onClick={(e: Event) => {
                  e.preventDefault();
                  setCurrentCell(null);
                  props.onSelectLocation?.(undefined);
                }}
              >
                Reset
              </Button>
            </Show>
          </Show>
        </p>
      </div>
      <LocationTooltip
        forRef={ref}
        location={(relative) => {
          if (isGrabbing()) {
            return;
          }
          const cell = worldMapPositionToLocationCell(
            relative.x + (ref?.scrollLeft || 0),
            relative.y + (ref?.scrollTop || 0),
          );
          return cellLocations().get(cell);
        }}
      />
    </>
  );
};

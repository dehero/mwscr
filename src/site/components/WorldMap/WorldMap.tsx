import { BooleanOperations, Box, Polygon } from '@flatten-js/core';
import clsx from 'clsx';
import { type Component, createContext, createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { navigate } from 'vike/client/router';
import { getLocationCellCoordinates, type Location, type LocationCell } from '../../../core/entities/location.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Frame } from '../Frame/Frame.jsx';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import styles from './WorldMap.module.css';

const CELL_SIZE = 18;
const CELL_SHIFT_X = 522;
const CELL_SHIFT_Y = 504;

export interface WorldMapProps {
  locations: Location[];
  class?: string;
  onLocationClick?: (location: Location) => void;
  selectedLocation?: string;
  discoveredLocations?: string[];
}

interface CellMarkerProps {
  cell: LocationCell;
}

interface WorldMapContext {
  onLocationClick?: (location: Location) => void;
}

function mapPositionToCell(x: number, y: number): LocationCell {
  return `${Math.floor((x - CELL_SHIFT_X) / CELL_SIZE)} ${Math.floor((CELL_SHIFT_Y - y) / CELL_SIZE) + 1}`;
}

function cellToMapPosition(cell: LocationCell) {
  const [x, y] = getLocationCellCoordinates(cell);

  return [CELL_SHIFT_X + x * CELL_SIZE, CELL_SHIFT_Y - y * CELL_SIZE];
}

function locationToMapPolygon(location: Location) {
  const cells = asArray(location.cell).map((cell) => {
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

export const WorldMap: Component<WorldMapProps> = (props) => {
  const [grabStartPosition, setGrabStartPosition] = createSignal<{
    scrollLeft: number;
    scrollTop: number;
    x: number;
    y: number;
  } | null>(null);
  const [isGrabbing, setIsGrabbing] = createSignal(false);

  const worldLocations = createMemo(() =>
    props.locations.filter(
      (location) =>
        (location.type === 'exterior' || location.type === 'region') &&
        (!location.addon || location.addon === 'Bloodmoon'),
    ),
  );
  const exteriors = createMemo(() => worldLocations().filter((location) => location.type === 'exterior'));

  const cellLocations = createMemo(() => {
    const result = new Map(
      props.locations.flatMap((location) => asArray(location.cell).map((cell) => [cell, location])),
    );
    return result;
  });

  const locationPolygons = createMemo(() =>
    worldLocations().map((location): [string, Polygon | undefined] => [location.title, locationToMapPolygon(location)]),
  );

  const discoveredPolygons = createMemo(() =>
    locationPolygons().filter(([location]) => props.discoveredLocations?.includes(location)),
  );

  let ref: HTMLDivElement | undefined;
  let mapRef: HTMLDivElement | undefined;

  const handlePolygonClick = (e: Event) => {
    if (e.target instanceof SVGPathElement) {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (
        e.target.parentElement &&
        'href' in e.target.parentElement &&
        e.target.parentElement.href instanceof SVGAnimatedString
      ) {
        const href = e.target.parentElement.href.baseVal;

        if (href) {
          e.preventDefault();
          const url = new URL(window.location.href);
          // @ts-expect-error No proper type for `navigate`
          navigate(url.origin + href);
        }
      }
    }
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

  const handleMouseDown = (e: MouseEvent) => {
    if (ref) {
      e.preventDefault();
      setGrabStartPosition({ scrollLeft: ref.scrollLeft, scrollTop: ref.scrollTop, x: e.pageX, y: e.pageY });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
    setGrabStartPosition(null);
    setIsGrabbing(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
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
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    }
  });

  return (
    <WorldMapContext.Provider value={{ onLocationClick: props.onLocationClick }}>
      <Frame
        variant="thin"
        class={clsx(styles.container, isGrabbing() && styles.grabbing, props.class)}
        ref={ref}
        onMouseDown={handleMouseDown}
      >
        <div class={styles.map} ref={mapRef}>
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
          <svg
            class={styles.selection}
            width="954"
            height="854"
            viewBox="0 0 954 854"
            onClick={handlePolygonClick}
            innerHTML={locationPolygons()
              .map(
                ([location, polygon]) =>
                  `<a href="${postsRoute.createUrl({
                    managerName: 'posts',
                    location,
                    original: 'true',
                  })}" class="${styles.selectionLink}">${polygon?.svg({
                    className: clsx(styles.selectionPolygon, location === props.selectedLocation && styles.selected),
                  })}</a>`,
              )
              .join('\n')}
          />
          <For each={exteriors()}>
            {(exterior) => <For each={asArray(exterior.cell)}>{(cell) => <CellMarker cell={cell} />}</For>}
          </For>
        </div>
      </Frame>
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
    </WorldMapContext.Provider>
  );
};

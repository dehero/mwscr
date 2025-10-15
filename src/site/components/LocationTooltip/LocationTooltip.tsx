import type { PositionRelativeToElement } from '@solid-primitives/mouse';
import { type Component, createResource, Show, splitProps } from 'solid-js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import { isPostsUsageEmpty, postsUsageToString } from '../../../core/entities/posts-usage.js';
import { dataManager } from '../../data-managers/manager.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './LocationTooltip.module.css';

interface LocationTooltipProps extends Omit<TooltipProps, 'children'> {
  location: string | LocationInfo | ((position: PositionRelativeToElement) => LocationInfo | undefined);
}

export const LocationTooltip: Component<LocationTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['location']);

  const [locationInfo] = createResource(
    () => local.location,
    (location) => (typeof location === 'string' ? dataManager.getLocationInfo(location) : location),
  );

  return (
    <Tooltip {...rest}>
      {(position) => {
        const info = locationInfo();
        const location = typeof info === 'function' ? info(position) : info;

        if (!location) {
          return;
        }

        return (
          <>
            <span class={styles.title}>{location.title}</span>
            <span>{location.titleRu}</span>
            <span>Type: {location.type}</span>
            <Show when={location.addon}>
              <span>Addon: {location.addon}</span>
            </Show>
            <Show when={'discovered' in location && !isPostsUsageEmpty(location.discovered)}>
              <span>Usage: {'discovered' in location && postsUsageToString(location.discovered)}</span>
            </Show>
          </>
        );
      }}
    </Tooltip>
  );
};

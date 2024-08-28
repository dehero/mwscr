import type { PositionRelativeToElement } from '@solid-primitives/mouse';
import { type Component, Show, splitProps } from 'solid-js';
import type { Location } from '../../../core/entities/location.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './LocationTooltip.module.css';

interface LocationTooltipProps extends Omit<TooltipProps, 'children'> {
  location: Location | ((position: PositionRelativeToElement) => Location | undefined);
}

export const LocationTooltip: Component<LocationTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['location']);

  return (
    <Tooltip {...rest}>
      {(position) => {
        const location = typeof local.location === 'function' ? local.location(position) : local.location;

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
          </>
        );
      }}
    </Tooltip>
  );
};

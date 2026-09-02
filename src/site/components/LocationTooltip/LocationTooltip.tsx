import type { PositionRelativeToElement } from '@solid-primitives/mouse';
import { type Component, createResource, Show, splitProps } from 'solid-js';
import { locationTypeDescriptors } from '../../../core/entities/location.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import { isPostsUsageEmpty, postsUsageToString } from '../../../core/entities/posts-usage.js';
import { dataManager } from '../../data-managers/manager.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localField, localize } from '../../utils/intl-utils.js';
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
            <span class={styles.title}>{localField(location, 'title')}</span>
            <span>{localField(location, 'title', true)}</span>
            <span>
              {localize(texts.editing.fileType)}
              {': '}
              {localize(locationTypeDescriptors[location.type].title)}
            </span>
            <Show when={location.addon}>
              <span>
                {localize(texts.field.addon)}
                {': '}
                {location.addon}
              </span>
            </Show>
            <Show when={'discovered' in location && !isPostsUsageEmpty(location.discovered)}>
              <span>
                {localize(texts.location.usage)}
                {': '}
                {'discovered' in location && postsUsageToString(location.discovered, currentLocale())}
              </span>
            </Show>
          </>
        );
      }}
    </Tooltip>
  );
};

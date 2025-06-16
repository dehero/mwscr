import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, Show } from 'solid-js';
import { USER_PREVIEW_HEIGHT, USER_PREVIEW_MAX_WIDTH, UserPreview } from '../UserPreview/UserPreview.jsx';
import { Toolbar } from './Toolbar.jsx';
import type { UserPreviewsProps } from './UserPreviews.jsx';
import styles from './UserPreviews.module.css';

const gap = 8;
const padding = 4;

const calculateGridItemSize = (crossAxisSize: number) => {
  // Compensate column width rounding shift with container's right padding
  const containerSize = crossAxisSize - padding;
  const count = Math.ceil(containerSize / (USER_PREVIEW_MAX_WIDTH + gap));
  const width = Math.round(containerSize / count);

  return {
    width,
    height: USER_PREVIEW_HEIGHT - 1,
  };
};

export const VirtualUserPreviews: Component<UserPreviewsProps> = (props) => {
  let containerRef;

  return (
    <div class={styles.virtualContainerWrapper}>
      <Show when={props.label}>
        <Toolbar label={props.label} class={styles.virtualToolbar} />
      </Show>
      <VirtualContainer
        items={props.userInfos}
        scrollTarget={props.scrollTarget || containerRef}
        // Calculate how many grid columns to show
        crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
        itemSize={calculateGridItemSize}
      >
        {(itemProps) => (
          <div style={itemProps.style} class={styles.virtualItem} tabIndex={itemProps.tabIndex} role="listitem">
            <UserPreview userInfo={itemProps.item} class={styles.item} />
          </div>
        )}
      </VirtualContainer>
    </div>
  );
};

export default VirtualUserPreviews;

import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, Show } from 'solid-js';
import {
  POST_PREVIEW_GAP,
  POST_PREVIEW_INFO_MIN_HEIGHT,
  POST_PREVIEW_MAX_WIDTH,
  PostPreview,
} from '../PostPreview/PostPreview.js';
import styles from './ClientVirtualScrollContainer.module.css';
import type { PostPreviewsProps } from './PostPreviews.js';

const gap = 8;
const padding = 4;

const calculateGridItemSize = (crossAxisSize: number) => {
  // Compensate column width rounding shift with container's right padding
  const containerSize = crossAxisSize - padding;
  const count = Math.ceil(containerSize / (POST_PREVIEW_MAX_WIDTH + gap));
  const width = Math.round(containerSize / count);

  return {
    width,
    height: width + POST_PREVIEW_GAP + POST_PREVIEW_INFO_MIN_HEIGHT - 1,
  };
};

export const ClientVirtualScrollContainer: Component<PostPreviewsProps> = (props) => {
  let containerRef;

  return (
    <div class={styles.container}>
      <Show when={props.label}>
        <p class={styles.label}>{props.label}</p>
      </Show>
      <VirtualContainer
        items={props.postInfos}
        scrollTarget={props.scrollTarget || containerRef}
        // Calculate how many grid columns to show
        crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
        itemSize={calculateGridItemSize}
      >
        {(itemProps) => (
          <div style={itemProps.style} class={styles.virtualItem} tabIndex={itemProps.tabIndex} role="listitem">
            <PostPreview postInfo={itemProps.item} class={styles.item} maxHeightMultiplier={1} />
          </div>
        )}
      </VirtualContainer>
    </div>
  );
};

export default ClientVirtualScrollContainer;

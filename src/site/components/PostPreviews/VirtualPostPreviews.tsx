import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component } from 'solid-js';
import {
  POST_PREVIEW_GAP,
  POST_PREVIEW_INFO_MIN_HEIGHT,
  POST_PREVIEW_MAX_WIDTH,
  PostPreview,
} from '../PostPreview/PostPreview.jsx';
import type { PostPreviewsProps } from './PostPreviews.jsx';
import styles from './PostPreviews.module.css';

const gap = 8;
const padding = 8;

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

export const VirtualPostPreviews: Component<PostPreviewsProps> = (props) => {
  let containerRef;

  return (
    <div class={styles.virtualContainerWrapper}>
      <VirtualContainer
        items={props.postInfos}
        scrollTarget={props.scrollTarget || containerRef}
        // Calculate how many grid columns to show
        crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
        itemSize={calculateGridItemSize}
      >
        {(itemProps) => (
          <div style={itemProps.style} class={styles.virtualItem} tabIndex={itemProps.tabIndex} role="listitem">
            <PostPreview
              postInfo={itemProps.item}
              class={styles.item}
              maxHeightMultiplier={1}
              toggleSelectedOnClick={Boolean(props.selected?.length)}
              selected={props.selected?.includes(itemProps.item.id)}
              onSelectedChange={(value) => props.onSelectedChange?.(itemProps.item.id, value)}
            />
          </div>
        )}
      </VirtualContainer>
    </div>
  );
};

export default VirtualPostPreviews;

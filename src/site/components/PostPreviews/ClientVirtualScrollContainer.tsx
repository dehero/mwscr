import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component } from 'solid-js';
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
    height: width + POST_PREVIEW_GAP + POST_PREVIEW_INFO_MIN_HEIGHT,
  };
};

export const ClientVirtualScrollContainer: Component<PostPreviewsProps> = (props) => {
  let targetVertical;

  return (
    <div ref={targetVertical} class={styles.container}>
      <VirtualContainer
        items={props.postInfos}
        scrollTarget={targetVertical}
        // Calculate how many grid columns to show.
        crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
        // overscan={10}
        itemSize={calculateGridItemSize}
      >
        {(itemProps) => (
          <div style={itemProps.style} class={styles.item} tabIndex={itemProps.tabIndex} role="listitem">
            <PostPreview postInfo={itemProps.item} />
          </div>
        )}
      </VirtualContainer>
    </div>
  );
};

export default ClientVirtualScrollContainer;

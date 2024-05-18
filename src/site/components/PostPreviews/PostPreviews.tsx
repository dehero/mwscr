import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component } from 'solid-js';
import type { PostEntries } from '../../../core/entities/post.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostPreviews.module.css';

export interface PostPreviewsProps {
  postEntries: PostEntries;
  managerName: string;
}

const calculateGridItemSize = (crossAxisSize: number) => {
  const maxWidth = 336;

  const count = Math.ceil(crossAxisSize / maxWidth);
  const width = Math.floor(crossAxisSize / count);

  return {
    width,
    height: width + 34,
  };
};

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  let targetVertical;

  return (
    <div ref={targetVertical} class={styles.scrollContainer}>
      <VirtualContainer
        items={props.postEntries}
        scrollTarget={targetVertical}
        // Calculate how many grid columns to show.
        crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
        // overscan={10}
        itemSize={calculateGridItemSize}
      >
        {(itemProps) => (
          <div style={itemProps.style} class={styles.listItem} tabIndex={itemProps.tabIndex} role="listitem">
            <PostPreview managerName={props.managerName} postEntry={itemProps.item} />
          </div>
        )}
      </VirtualContainer>
    </div>
  );
};

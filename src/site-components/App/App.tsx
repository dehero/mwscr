import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, createResource } from 'solid-js';
import { comparePostEntriesById, type Post, type PostEntries } from '../../entities/post.js';
import { Frame } from '../Frame/Frame.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './App.module.css';

const postChunks = import.meta.glob('../../../data/published/*.yml', { import: 'default' });

const getPosts = async (): Promise<PostEntries> => {
  const result: Map<string, Post> = new Map();
  const references: Map<string, string> = new Map();

  for (const chunk of Object.values(postChunks)) {
    const entries = Object.entries((await chunk()) as Record<string, Post | string>);
    for (const [id, post] of entries) {
      if (typeof post === 'string') {
        references.set(post, id);
      } else {
        result.set(id, post);
      }
    }
  }

  // Resolve references
  for (const [id, post] of references) {
    const ref = result.get(post);
    if (ref) {
      result.set(id, ref);
    }
  }

  return [...result.entries()].sort(comparePostEntriesById('desc'));
};

const ListItem: Component<VirtualItemProps<[string, Post | string]>> = (props) => {
  return (
    <div style={props.style} class={styles.listItem} tabIndex={props.tabIndex} role="listitem">
      <PostPreview post={props.item[1]} />
    </div>
  );
};

const calculateGridItemSize = (crossAxisSize: number) => {
  const maxWidth = 336;

  const count = Math.ceil(crossAxisSize / maxWidth);
  const width = Math.floor(crossAxisSize / count);

  return {
    width,
    height: width + 34,
  };
};

export const App: Component = () => {
  let targetVertical;
  const [posts] = createResource(getPosts);

  return (
    <>
      <Frame variant="thin" class={styles.frame}>
        Morrowind Screenshots
      </Frame>

      <div ref={targetVertical} class={styles.scrollContainer}>
        <VirtualContainer
          items={posts()}
          scrollTarget={targetVertical}
          // Calculate how many grid columns to show.
          crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
          // overscan={10}
          itemSize={calculateGridItemSize}
        >
          {ListItem}
        </VirtualContainer>
      </div>
    </>
  );
};

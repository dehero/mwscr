import { type Component, For, Show } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostPreviews.module.css';

const VirtualScrollContainer = clientOnly(() => import('./ClientVirtualScrollContainer.js'));

export interface PostPreviewsProps {
  label?: string;
  postInfos: PostInfo[];
  scrollTarget?: HTMLElement;
}

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  const lastPostInfos = () => props.postInfos.slice(0, 18);
  return (
    <VirtualScrollContainer
      fallback={
        <div class={styles.container}>
          <Show when={props.label}>
            <p class={styles.label}>{props.label}</p>
          </Show>
          <div class={styles.items}>
            <For each={lastPostInfos()}>
              {(postInfo) => <PostPreview postInfo={postInfo} class={styles.item} maxHeightMultiplier={1} />}
            </For>
          </div>
        </div>
      }
      label={props.label}
      postInfos={props.postInfos}
      scrollTarget={props.scrollTarget}
    />
  );
};

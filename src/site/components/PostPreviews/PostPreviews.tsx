import { type Component, For } from 'solid-js';
import { clientOnly } from 'vike-solid/ClientOnly';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostPreviews.module.css';

const VirtualScrollContainer = clientOnly(() => import('./ClientVirtualScrollContainer.js'));

export interface PostPreviewsProps {
  postInfos: PostInfo[];
  managerName: string;
}

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  const lastPostInfos = () => props.postInfos.slice(0, 18);
  return (
    <VirtualScrollContainer
      fallback={
        <div class={styles.container}>
          <For each={lastPostInfos()}>
            {(postInfo) => <PostPreview postInfo={postInfo} managerName={props.managerName} class={styles.item} />}
          </For>
        </div>
      }
      postInfos={props.postInfos}
      managerName={props.managerName}
    />
  );
};

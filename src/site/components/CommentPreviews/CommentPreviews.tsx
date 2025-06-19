import clsx from 'clsx';
import { type Component, For } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.js';
import { CommentPreview } from '../CommentPreview/CommentPreview.jsx';
import { Frame } from '../Frame/Frame.jsx';
import styles from './CommentPreviews.module.css';

export interface CommentPreviewsProps {
  commentInfos: CommentInfo[];
  class?: string;
  hideAuthorName?: boolean;
}

export const CommentPreviews: Component<CommentPreviewsProps> = (props) => {
  // const [postInfo] = createResource(
  //   () => props.postId,
  //   (id) => dataManager.getPostInfo('posts', id),
  // );

  /* <Show when={postInfo()}>
          {(postInfo) => (
            <PostContentPreview content={postInfo().content} type={postInfo().type} class={styles.preview} />
          )}
        </Show> */

  return (
    <Frame class={clsx(styles.container, props.class)}>
      <For each={props.commentInfos}>
        {(info) => <CommentPreview commentInfo={info} hideAuthorName={props.hideAuthorName} />}
      </For>
    </Frame>
  );
};

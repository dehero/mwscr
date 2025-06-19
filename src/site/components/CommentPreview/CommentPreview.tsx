import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.js';
import { Comment } from '../Comment/Comment.jsx';
import styles from './CommentPreview.module.css';

export interface CommentPreviewProps {
  commentInfo: CommentInfo;
  class?: string;
  hideAuthorName?: boolean;
}

export const CommentPreview: Component<CommentPreviewProps> = (props) => {
  return (
    <Show
      when={props.commentInfo.parent}
      fallback={
        <Comment
          comment={props.commentInfo}
          class={props.class}
          hideAuthorName={props.hideAuthorName}
          service={props.commentInfo.service}
        />
      }
    >
      {(parent) => (
        <section class={clsx(styles.container, props.class)}>
          <Comment
            comment={parent()}
            hideAuthorName={props.hideAuthorName && props.commentInfo.author === parent().author}
            hideDate
            hideTime
            service={props.commentInfo.service}
          />
          <Comment comment={props.commentInfo} class={styles.reply} hideAuthorName={props.hideAuthorName} />
        </section>
      )}
    </Show>
  );
};

import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { Comment } from '../../../core/entities/comment.ts';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import { Comment as CommentView } from '../Comment/Comment.tsx';
import styles from './CommentPreview.module.css';

export interface CommentPreviewProps {
  commentInfos: CommentInfo[];
  parent?: Comment;
  parentInfo?: CommentInfo;
  class?: string;
  hideAuthorName?: boolean;
}

export const CommentPreview: Component<CommentPreviewProps> = (props) => {
  const parent = () => props.parentInfo ?? props.parent;
  const firstComment = () => props.commentInfos[0];

  return (
    <Show
      when={parent()}
      fallback={
        <For each={props.commentInfos}>
          {(info) => (
            <CommentView
              comment={info}
              class={props.class}
              hideAuthorName={props.hideAuthorName}
              service={info.service}
            />
          )}
        </For>
      }
    >
      {(parent) => (
        <section class={clsx(styles.container, props.class)}>
          <Show
            when={props.parentInfo}
            fallback={
              <CommentView
                comment={parent()}
                hideAuthorName={props.hideAuthorName && firstComment()?.author === parent().author}
                hideDate
                hideTime
                service={firstComment()?.service}
              />
            }
          >
            {(parentInfo) => (
              <CommentView
                comment={parentInfo()}
                hideAuthorName={props.hideAuthorName}
                service={parentInfo().service}
              />
            )}
          </Show>
          <For each={props.commentInfos}>
            {(info) => <CommentView comment={info} class={styles.reply} hideAuthorName={props.hideAuthorName} />}
          </For>
        </section>
      )}
    </Show>
  );
};

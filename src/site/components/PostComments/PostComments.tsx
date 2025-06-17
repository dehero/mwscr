import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { getAllPostCommentsSorted } from '../../../core/entities/post.js';
import type { Publication } from '../../../core/entities/publication.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { dateToString, formatDate } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { PostComment } from '../PostComment/PostComment.jsx';
import styles from './PostComments.module.css';

export interface PostCommentsProps {
  class?: string;
  publications: Publication[];
}

export const PostComments: Component<PostCommentsProps> = (props) => {
  const commentGroups = () => [
    ...groupBy(getAllPostCommentsSorted(props.publications), (comment) => dateToString(comment.datetime)).entries(),
  ];

  return (
    <Frame variant="thin" class={clsx(styles.comments, props.class)}>
      <For each={commentGroups()} fallback={<span class={styles.fallback}>No comments yet</span>}>
        {([dateStr, comments], index) => (
          <>
            <Show when={index() > 0}>
              <Divider />
            </Show>
            <section class={styles.group}>
              <h3 class={styles.title}>{formatDate(new Date(dateStr))}</h3>
              <For each={comments}>
                {(comment) => (
                  <>
                    <PostComment comment={comment} class={styles.comment} service={comment.service} />
                    <For each={comment.replies}>{(reply) => <PostComment comment={reply} class={styles.reply} />}</For>
                  </>
                )}
              </For>
            </section>
          </>
        )}
      </For>
    </Frame>
  );
};

import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { Post } from '../../../core/entities/post.js';
import { getAllPostCommentsSorted } from '../../../core/entities/post.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { dateToString, formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './PostComments.module.css';

export interface PostCommentsProps {
  class?: string;
  post: Post;
}

export const PostComments: Component<PostCommentsProps> = (props) => {
  const commentGroups = () => [
    ...groupBy(getAllPostCommentsSorted(props.post), (comment) => dateToString(comment.datetime)).entries(),
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
                    <section class={styles.comment}>
                      <h4 class={styles.title}>
                        [{comment.service}] {formatTime(comment.datetime, true)} {comment.author}
                      </h4>
                      <p class={styles.text}>{comment.text}</p>
                    </section>
                    <For each={comment.replies}>
                      {(reply) => (
                        <section class={styles.reply}>
                          <h5 class={styles.title}>
                            {formatTime(comment.datetime, true)} {reply.author}
                          </h5>
                          <p class={styles.text}>{reply.text}</p>
                        </section>
                      )}
                    </For>
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

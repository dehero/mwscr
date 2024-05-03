import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { Post } from '../../../core/entities/post.js';
import { getAllPostComments } from '../../../core/entities/post.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './PostComments.module.css';

export interface PostCommentsProps {
  class?: string;
  post: Post;
}

export const PostComments: Component<PostCommentsProps> = (props) => {
  const commentGroups = () => [
    ...groupBy(getAllPostComments(props.post), (comment) => comment.datetime.toDateString()).entries(),
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
              <h3 class={styles.title}>{new Date(dateStr).toLocaleDateString('en-GB')}</h3>
              <For each={comments}>
                {(comment) => (
                  <>
                    <section class={styles.comment}>
                      <h4 class={styles.title}>
                        [{comment.service}] {comment.datetime.toLocaleTimeString('en-GB')} {comment.author}
                      </h4>
                      <p class={styles.text}>{comment.text}</p>
                    </section>
                    <For each={comment.replies}>
                      {(reply) => (
                        <section class={styles.reply}>
                          <h5 class={styles.title}>
                            {reply.datetime.toLocaleTimeString('en-GB')} {reply.author}
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

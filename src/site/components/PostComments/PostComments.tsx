import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { compareCommentsByDatetime } from '../../../core/entities/comment.js';
import { getPublicationsCommentsWithService, type Publication } from '../../../core/entities/publication.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { dateToString, formatDate } from '../../../core/utils/date-utils.js';
import { Comment } from '../Comment/Comment.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './PostComments.module.css';

export interface PostCommentsProps {
  publications: Publication[];
  class?: string;
}

const sorter = compareCommentsByDatetime('asc');

export const PostComments: Component<PostCommentsProps> = (props) => {
  const commentGroups = () => [
    ...groupBy(getPublicationsCommentsWithService(props.publications, sorter), (comment) =>
      dateToString(comment.datetime),
    ).entries(),
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
                    <Comment comment={comment} class={styles.comment} service={comment.service} hideDate />
                    <For each={comment.replies}>{(reply) => <Comment comment={reply} class={styles.reply} />}</For>
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

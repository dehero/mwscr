import { type Component, createResource, Show, splitProps } from 'solid-js';
import type { Post, PostEntry } from '../../../core/entities/post.js';
import {
  getPostCommentCount,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
} from '../../../core/entities/post.js';
import { getUserEntryName } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { users } from '../../data-managers/users.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children'> {
  postEntry: PostEntry<Post>;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const likes = () => getPostTotalLikes(local.postEntry[1]);
  const views = () => getPostTotalViews(local.postEntry[1]);
  const rating = () => Number(getPostRating(local.postEntry[1]).toFixed(2));
  const commentCount = () => getPostCommentCount(local.postEntry[1]);
  const [authors] = createResource(() => asArray(local.postEntry[1].author), users.getEntries.bind(users));

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.postEntry[1].title || local.postEntry[0]}</span>
      <Show when={local.postEntry[1].titleRu}>
        <span class={styles.titleRu}>{local.postEntry[1].titleRu}</span>
      </Show>
      {/* <Divider class={styles.divider} /> */}
      <Show when={local.postEntry[1].type}>
        <span class={styles.type}>Type: {local.postEntry[1].type}</span>
      </Show>
      <Show when={authors()?.length}>
        <span class={styles.author}>Author: {authors()?.map(getUserEntryName).join(', ')}</span>
      </Show>
      <Show when={local.postEntry[1].location}>
        <span class={styles.location}>Location: {local.postEntry[1].location}</span>
      </Show>
      <Show when={local.postEntry[1].engine}>
        <span class={styles.engine}>Engine: {local.postEntry[1].engine}</span>
      </Show>
      <Show when={local.postEntry[1].addon}>
        <span class={styles.addon}>Addon: {local.postEntry[1].addon}</span>
      </Show>
      <Show when={local.postEntry[1].tags?.length}>
        <span class={styles.tags}>Tags: {local.postEntry[1].tags?.join(', ')}</span>
      </Show>
      <Show when={likes()}>
        <span class={styles.likes}>Likes: {likes()}</span>
      </Show>
      <Show when={views()}>
        <span class={styles.views}>Views: {views()}</span>
      </Show>
      <Show when={rating()}>
        <span class={styles.rating}>Rating: {rating()}</span>
      </Show>
      <Show when={commentCount()}>
        <span class={styles.commentCount}>Comments: {commentCount()}</span>
      </Show>
    </Tooltip>
  );
};

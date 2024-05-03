import { type Component, Show, splitProps } from 'solid-js';
import {
  getPostCommentCount,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
  type Post,
} from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { getUserName } from '../../data-managers/users.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children'> {
  post: Post;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['post']);
  const likes = () => getPostTotalLikes(local.post);
  const views = () => getPostTotalViews(local.post);
  const rating = () => Number(getPostRating(local.post).toFixed(2));
  const commentCount = () => getPostCommentCount(local.post);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.post.title}</span>
      <span class={styles.titleRu}>{local.post.titleRu}</span>
      {/* <Divider class={styles.divider} /> */}
      <Show when={local.post.type}>
        <span class={styles.type}>Type: {local.post.type}</span>
      </Show>
      <Show when={local.post.author}>
        <span class={styles.author}>Author: {asArray(local.post.author).map(getUserName).join(', ')}</span>
      </Show>
      <Show when={local.post.location}>
        <span class={styles.location}>Location: {local.post.location}</span>
      </Show>
      <Show when={local.post.engine}>
        <span class={styles.engine}>Engine: {local.post.engine}</span>
      </Show>
      <Show when={local.post.addon}>
        <span class={styles.addon}>Addon: {local.post.addon}</span>
      </Show>
      <Show when={local.post.tags?.length}>
        <span class={styles.tags}>Tags: {local.post.tags?.join(', ')}</span>
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

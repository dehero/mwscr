import { type Component, Show, splitProps } from 'solid-js';
import type { Post } from '../../entities/post.js';
import { getUserName } from '../../site-data-managers/users.js';
import { asArray } from '../../utils/common-utils.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children'> {
  post: Post;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['post']);

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
      <Show when={local.post.likes}>
        <span class={styles.likes}>Likes: {local.post.likes}</span>
      </Show>
      <Show when={local.post.views}>
        <span class={styles.views}>Views: {local.post.views}</span>
      </Show>
      <Show when={local.post.rating}>
        <span class={styles.rating}>Rating: {local.post.rating}</span>
      </Show>
      <Show when={local.post.commentCount}>
        <span class={styles.commentCount}>Comments: {local.post.commentCount}</span>
      </Show>
    </Tooltip>
  );
};

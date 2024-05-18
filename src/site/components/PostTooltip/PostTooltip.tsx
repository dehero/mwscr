import { type Component, createResource, For, Show, splitProps } from 'solid-js';
import type { Post, PostEntry } from '../../../core/entities/post.js';
import {
  getPostCommentCount,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
  POST_VIOLATIONS,
} from '../../../core/entities/post.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { users } from '../../data-managers/users.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
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
  const [requesters] = createResource(() => asArray(local.postEntry[1].request?.user), users.getEntries.bind(users));

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.postEntry[1].title || local.postEntry[0]}</span>
      <Show when={local.postEntry[1].titleRu}>
        <span class={styles.titleRu}>{local.postEntry[1].titleRu}</span>
      </Show>
      <Show when={local.postEntry[1].type}>
        <span class={styles.type}>Type: {local.postEntry[1].type}</span>
      </Show>
      <Show when={authors()?.length}>
        <span class={styles.author}>
          {'Author: '}
          <For each={authors()}>
            {(entry, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <Icon color="stealth" size="small" variant="flat" class={styles.icon}>
                  {getUserEntryTitle(entry)[0]?.toLocaleUpperCase() ?? '?'}
                </Icon>
                {getUserEntryTitle(entry)}
              </>
            )}
          </For>
        </span>
      </Show>
      <Show when={requesters()?.length}>
        <span class={styles.author}>
          {'Requester: '}
          <For each={requesters()}>
            {(entry, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <Icon color="magic" size="small" variant="flat" class={styles.icon}>
                  {getUserEntryTitle(entry)[0]?.toLocaleUpperCase() ?? '?'}
                </Icon>
                {getUserEntryTitle(entry)}
              </>
            )}
          </For>
        </span>
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
      <Show when={local.postEntry[1].mark}>
        <span class={styles.mark}>
          {"Editor's Mark: "}
          <Icon color="combat" size="small" variant="flat" class={styles.icon}>
            {props.postEntry[1].mark?.[0]}
          </Icon>
          {local.postEntry[1].mark?.[1]}
        </span>
      </Show>
      <Show when={local.postEntry[1].violation}>
        {(violation) => (
          <span class={styles.addon}>
            {'Violation: '}
            <Icon color="health" size="small" variant="flat" class={styles.icon}>
              {POST_VIOLATIONS[violation()].letter}
            </Icon>
            {POST_VIOLATIONS[violation()].title}
          </span>
        )}
      </Show>
      <Show when={local.postEntry[1].tags?.length}>
        <span class={styles.tags}>Tags: {local.postEntry[1].tags?.join(', ')}</span>
      </Show>
      <Show when={local.postEntry[1].posts}>
        <span class={styles.published}>
          <GoldIcon class={styles.icon} />
          Published
        </span>
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

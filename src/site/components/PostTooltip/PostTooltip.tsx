import { type Component, For, Show, splitProps } from 'solid-js';
import { getPostDateById, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { getUserEntryLetter, getUserEntryTitle } from '../../../core/entities/user.js';
import { capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children'> {
  postInfo: PostInfo;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['postInfo']);
  const date = () => getPostDateById(local.postInfo.id);
  const refDate = () => (local.postInfo.refId ? getPostDateById(local.postInfo.refId) : undefined);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.postInfo.title || local.postInfo.id}</span>
      <Show when={local.postInfo.titleRu}>
        <span class={styles.titleRu}>{local.postInfo.titleRu}</span>
      </Show>
      <Show when={local.postInfo.published}>
        <span class={styles.published}>
          <GoldIcon class={styles.icon} />
          Published
        </span>
      </Show>
      <Show when={isValidDate(date())}>
        <span class={styles.date}>
          Date: {formatDate(date()!)}
          <Show when={isValidDate(refDate())}>*</Show>
        </span>
      </Show>
      <Show when={local.postInfo.type}>
        <span class={styles.type}>Type: {POST_TYPES.find((info) => info.id === local.postInfo.type)?.title}</span>
      </Show>
      <Show when={local.postInfo.authorEntries.length}>
        <span class={styles.author}>
          {'Author: '}
          <For each={local.postInfo.authorEntries}>
            {(entry, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <Icon color="stealth" size="small" variant="flat" class={styles.icon}>
                  {getUserEntryLetter(entry)}
                </Icon>
                {getUserEntryTitle(entry)}
              </>
            )}
          </For>
        </span>
      </Show>
      <Show when={local.postInfo.requesterEntry}>
        {(entry) => (
          <span class={styles.author}>
            {'Requester: '}
            <Icon color="magic" size="small" variant="flat" class={styles.icon}>
              {getUserEntryTitle(entry())[0]?.toLocaleUpperCase() ?? '?'}
            </Icon>
            {getUserEntryTitle(entry())}
          </span>
        )}
      </Show>
      <Show when={local.postInfo.location?.title}>
        <span class={styles.location}>Location: {local.postInfo.location?.title}</span>
      </Show>
      <Show when={local.postInfo.engine}>
        <span class={styles.engine}>Engine: {local.postInfo.engine}</span>
      </Show>
      <Show when={local.postInfo.addon}>
        <span class={styles.addon}>Addon: {local.postInfo.addon}</span>
      </Show>
      <Show when={local.postInfo.violation}>
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
      <Show when={local.postInfo.tags?.length}>
        <span class={styles.tags}>Tags: {local.postInfo.tags?.join(', ')}</span>
      </Show>
      <Show when={local.postInfo.mark}>
        <span class={styles.mark}>
          {"Editor's Mark: "}
          <Icon color="combat" size="small" variant="flat" class={styles.icon}>
            {props.postInfo.mark?.[0]}
          </Icon>
          {local.postInfo.mark?.[1]}
        </span>
      </Show>
      <Show when={local.postInfo.rating}>
        <span class={styles.rating}>Rating: {local.postInfo.rating}</span>
      </Show>
      <Show when={local.postInfo.likes}>
        <span class={styles.likes}>Likes: {local.postInfo.likes}</span>
      </Show>
      <Show when={local.postInfo.views}>
        <span class={styles.views}>Views: {local.postInfo.views}</span>
      </Show>
      <Show when={local.postInfo.followers}>
        <span class={styles.views}>Followers: {local.postInfo.followers}</span>
      </Show>
      <Show when={local.postInfo.engagement}>
        <span class={styles.engagement}>Engagement: {local.postInfo.engagement}</span>
      </Show>
      <Show when={local.postInfo.commentCount}>
        <span class={styles.commentCount}>Comments: {local.postInfo.commentCount}</span>
      </Show>
      <Show when={isValidDate(refDate())}>
        <Divider class={styles.divider} />
        <span class={styles.date}>* {formatDate(refDate()!)}</span>
      </Show>
      <Show when={local.postInfo.publishableErrors}>
        {(errors) => (
          <>
            <Divider class={styles.divider} />
            <p class={styles.publishableErrors}>
              <Icon color="attribute" size="small" variant="flat">
                !
              </Icon>{' '}
              {capitalizeFirstLetter(errors().join(', '))}
            </p>
          </>
        )}
      </Show>
    </Tooltip>
  );
};

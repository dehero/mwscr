import clsx from 'clsx';
import { type Component, For, Show, splitProps } from 'solid-js';
import { createMemo } from 'solid-js';
import {
  getPostDateById,
  getPostTypeAspectRatio,
  postTypeDescriptors,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { POSTS_MANAGER_INFOS } from '../../../core/entities/posts-manager.js';
import { getUserTitleLetter } from '../../../core/entities/user.js';
import { asArray, capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { postRoute } from '../../routes/post-route.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import type { TooltipAction, TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children' | 'actions'> {
  postInfo: PostInfo;
  showContent?: boolean;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['postInfo', 'showContent']);
  const date = () => getPostDateById(local.postInfo.id);
  const refDate = () => (local.postInfo.refId ? getPostDateById(local.postInfo.refId) : undefined);
  const content = () => asArray(local.postInfo.content).slice(0, 4);
  const aspectRatio = () => getPostTypeAspectRatio(local.postInfo.type);
  const alt = () => props.postInfo.tags?.join(' ');

  const postActions = createMemo(
    (): PostAction[] => POSTS_MANAGER_INFOS.find((info) => info.name === local.postInfo.managerName)?.actions ?? [],
  );

  return (
    <Tooltip
      actions={[
        { url: postRoute.createUrl({ managerName: local.postInfo.managerName, id: local.postInfo.id }), label: 'View' },
        postActions().includes('edit')
          ? {
              url: createDetachedDialogFragment('post-editing', {
                managerName: local.postInfo.managerName,
                id: local.postInfo.id,
              }),
              label: 'Edit',
            }
          : undefined,
        postActions().includes('review')
          ? {
              url: createDetachedDialogFragment('post-review', {
                managerName: local.postInfo.managerName,
                id: local.postInfo.id,
              }),
              label: 'Review',
            }
          : undefined,
        postActions().includes('merge')
          ? {
              url: createDetachedDialogFragment('post-merge', {
                managerName: local.postInfo.managerName,
                id: local.postInfo.id,
              }),
              label: 'Merge',
            }
          : undefined,
        postActions().includes('locate')
          ? {
              url: createDetachedDialogFragment('post-location', {
                id: local.postInfo.id,
                managerName: local.postInfo.managerName,
              }),
              label: local.postInfo.location ? 'Precise Location' : 'Locate',
            }
          : undefined,
      ].filter((value): value is TooltipAction => Boolean(value))}
      {...rest}
    >
      <Show when={content().length > 0 && local.showContent}>
        <Show
          when={content().length > 2}
          fallback={
            <ResourcePreview
              url={content()[0] || ''}
              aspectRatio={aspectRatio()}
              class={styles.image}
              alt={alt()}
              maxHeightMultiplier={1.25}
            />
          }
        >
          <div class={clsx(styles[props.postInfo.type], styles.setContainer)}>
            <For each={content()}>
              {(url) => <ResourcePreview url={url} class={styles.setItem} aspectRatio="1/1" />}
            </For>
          </div>
        </Show>
      </Show>
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
        <span class={styles.type}>Type: {postTypeDescriptors[local.postInfo.type].title}</span>
      </Show>
      <Show when={local.postInfo.authorOptions.length}>
        <span class={styles.author}>
          {'Author: '}
          <For each={local.postInfo.authorOptions}>
            {(option, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <Icon color="stealth" size="small" variant="flat" class={styles.icon}>
                  {getUserTitleLetter(option.label)}
                </Icon>
                {option.label}
              </>
            )}
          </For>
        </span>
      </Show>
      <Show when={local.postInfo.requesterOption}>
        {(option) => (
          <span class={styles.author}>
            {'Requester: '}
            <Icon color="magic" size="small" variant="flat" class={styles.icon}>
              {getUserTitleLetter(option().label)}
            </Icon>
            {option().label}
          </span>
        )}
      </Show>
      <Show when={local.postInfo.location}>
        <span class={styles.location}>Location: {asArray(local.postInfo.location).join(', ')}</span>
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
              {postViolationDescriptors[violation()].letter}
            </Icon>
            {postViolationDescriptors[violation()].title}
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

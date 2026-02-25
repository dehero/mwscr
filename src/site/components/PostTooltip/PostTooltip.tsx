import { type Component, For, Show, splitProps } from 'solid-js';
import { createMemo } from 'solid-js';
import { aspectRatioToReadableText } from '../../../core/entities/media.js';
import { getPostDateById, postTypeDescriptors, postViolationDescriptors } from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import { asArray, capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { postRoute } from '../../routes/post-route.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.jsx';
import { PostTypeGlyph } from '../PostTypeGlyph/PostTypeGlyph.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import type { TooltipAction, TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import styles from './PostTooltip.module.css';

interface PostTooltipProps extends Omit<TooltipProps, 'children' | 'actions'> {
  postInfo: PostInfo;
  showContent?: boolean;
  selected?: boolean;
  onSelectedChange?: (value: boolean) => void;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const { messageBox } = useToaster();

  const [local, rest] = splitProps(props, ['postInfo', 'showContent']);
  const date = () => getPostDateById(local.postInfo.id);
  const refDate = () => (local.postInfo.refId ? getPostDateById(local.postInfo.refId) : undefined);
  const alt = () => props.postInfo.tags?.join(' ');

  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[local.postInfo.managerName].actions);

  const handleReset = async () => {
    const result = await messageBox('Are you sure you want to reset current local changes for this post?', [
      'Yes',
      'No',
    ]);
    if (result === 0) {
      dataManager.findPostsManager(local.postInfo.managerName)?.resetItemPatch(local.postInfo.id);
    }
  };

  const actions = () =>
    [
      props.postInfo.status !== 'removed' &&
      (postActions().includes('merge') || postActions().includes('compile')) &&
      props.onSelectedChange
        ? {
            onExecute: () => props.onSelectedChange?.(!props.selected),
            label: props.selected ? 'Unselect' : 'Select',
          }
        : undefined,
      props.postInfo.status !== 'removed' && postActions().includes('order') && local.postInfo.type === 'merch'
        ? {
            url: createDetachedDialogFragment(
              'merch-ordering',
              createPostPath(local.postInfo.managerName, local.postInfo.id),
            ),
            label: 'Order',
          }
        : undefined,
      props.postInfo.status !== 'added'
        ? {
            url: postRoute.createUrl({
              managerName: local.postInfo.managerName,
              id: local.postInfo.id,
              // id: local.postInfo.refId ? local.postInfo.refId : local.postInfo.id,
              // repostId: local.postInfo.refId ? local.postInfo.id : undefined,
            }),
            label: 'View',
          }
        : undefined,
      props.postInfo.status !== 'removed' && postActions().includes('edit')
        ? {
            url: createDetachedDialogFragment(
              'post-editing',
              createPostPath(local.postInfo.managerName, local.postInfo.id),
            ),
            label: 'Edit',
          }
        : undefined,
      props.postInfo.status !== 'removed' && postActions().includes('precise')
        ? {
            url: createDetachedDialogFragment(
              'post-precising',
              createPostPath(local.postInfo.managerName, local.postInfo.id),
            ),
            label: 'Precise',
          }
        : undefined,
      props.postInfo.status !== 'removed' && !local.postInfo.location && postActions().includes('locate')
        ? {
            url: createDetachedDialogFragment(
              'post-location',
              createPostPath(local.postInfo.managerName, local.postInfo.id),
            ),
            label: 'Locate',
          }
        : undefined,
      props.postInfo.status
        ? {
            label: props.postInfo.status === 'added' ? 'Remove' : 'Restore',
            onExecute: handleReset,
          }
        : undefined,
    ].filter(Boolean) as TooltipAction[];

  return (
    <Tooltip actions={actions()} {...rest}>
      <Show when={local.showContent}>
        <PostContentPreview
          content={local.postInfo.content}
          aspectRatio={local.postInfo.aspect}
          maxHeightMultiplier={1.25}
          alt={alt()}
          class={styles.image}
        />
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
          {formatDate(date()!)}
          <Show when={isValidDate(refDate())}>*</Show>
        </span>
      </Show>
      <Show when={local.postInfo.type}>
        <span class={styles.type}>
          {'Type: '}
          <Icon color="combat" size="small" variant="flat" class={styles.icon}>
            <PostTypeGlyph type={local.postInfo.type} />
          </Icon>
          {postTypeDescriptors[local.postInfo.type].title}
        </span>
      </Show>
      <Show when={local.postInfo.aspect}>
        <span class={styles.type}>
          {'Aspect Ratio: '}
          {aspectRatioToReadableText(local.postInfo.aspect)}
        </span>
      </Show>
      <Show when={local.postInfo.authorOptions.length}>
        <span class={styles.author}>
          {'Author: '}
          <For each={local.postInfo.authorOptions}>
            {(option, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <UserAvatar
                  image={option.image}
                  title={option.label ?? option.value ?? '?'}
                  size="small"
                  class={styles.avatar}
                />
                {option.label}
              </>
            )}
          </For>
        </span>
      </Show>
      <Show when={local.postInfo.requesterOption}>
        {(option) => (
          <span class={styles.author}>
            {'Requested By: '}
            <UserAvatar
              image={option().image}
              title={option().label ?? option().value ?? '?'}
              size="small"
              class={styles.avatar}
            />
            {option().label}
          </span>
        )}
      </Show>
      <Show when={local.postInfo.location}>
        <span class={styles.location}>Location: {asArray(local.postInfo.location).join(', ')}</span>
      </Show>
      <Show when={local.postInfo.locatorOption}>
        {(option) => (
          <span class={styles.author}>
            {'Located By: '}
            <UserAvatar
              image={option().image}
              title={option().label ?? option().value ?? '?'}
              size="small"
              class={styles.avatar}
            />
            {option().label}
          </span>
        )}
      </Show>
      <Show when={local.postInfo.placement}>
        <span class={styles.placement}>Placement: {local.postInfo.placement}</span>
      </Show>
      <Show when={local.postInfo.engine}>
        <span class={styles.engine}>Engine: {local.postInfo.engine}</span>
      </Show>
      <Show when={local.postInfo.addon}>
        <span class={styles.addon}>Addon: {local.postInfo.addon}</span>
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
      <Show when={local.postInfo.violation}>
        <span class={styles.violation}>
          {'Violation: '}
          <For each={asArray(local.postInfo.violation)}>
            {(violation, index) => (
              <>
                {index() > 0 ? ', ' : ''}
                <Icon color="health" size="small" variant="flat" class={styles.icon}>
                  {postViolationDescriptors[violation].letter}
                </Icon>
                {postViolationDescriptors[violation].title}
              </>
            )}
          </For>
        </span>
      </Show>
      <Show when={local.postInfo.tags?.length}>
        <span class={styles.tags}>Tags: {local.postInfo.tags?.join(', ')}</span>
      </Show>
      <Show when={isValidDate(local.postInfo.created)}>
        <span class={styles.created}>Created: {formatDate(local.postInfo.created!)}</span>
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

      <Show when={isValidDate(refDate()) || local.postInfo.publishableErrors || local.postInfo.status}>
        <Divider class={styles.divider} />

        <Show when={isValidDate(refDate())}>
          <span class={styles.date}>* {formatDate(refDate()!)}</span>
        </Show>

        <Show when={local.postInfo.status}>
          {(status) => (
            <span class={styles.status}>
              <Icon color="attribute" size="small" variant="flat">
                {capitalizeFirstLetter(status())[0]}
              </Icon>{' '}
              {capitalizeFirstLetter(status())}
            </span>
          )}
        </Show>

        <Show when={local.postInfo.publishableErrors}>
          {(errors) => (
            <>
              <p class={styles.publishableErrors}>
                <Icon color="attribute" size="small" variant="flat">
                  !
                </Icon>{' '}
                {capitalizeFirstLetter(errors().join(', '))}
              </p>
            </>
          )}
        </Show>
      </Show>
    </Tooltip>
  );
};

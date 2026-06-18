import { type Component, createMemo, createResource, createSignal, For, Show, splitProps } from 'solid-js';
import { aspectRatioToReadableText } from '../../../core/entities/media.js';
import { getPostDateById, postTypeDescriptors, postViolationDescriptors } from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostPath, parsePostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
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
  postInfo: PostInfo | string;
  showContent?: boolean;
  selected?: boolean;
  onSelectedChange?: (value: boolean) => void;
}

export const PostTooltip: Component<PostTooltipProps> = (props) => {
  const { messageBox } = useToaster();
  const [local, rest] = splitProps(props, ['postInfo', 'showContent']);
  const [shouldOpen, setShouldOpen] = createSignal(false);

  const [postInfo] = createResource(
    () => (shouldOpen() ? local.postInfo : undefined),
    async (value) => {
      if (!value) {
        return undefined;
      }

      if (typeof value !== 'string') {
        return value;
      }

      const { managerName, id } = parsePostPath(value);

      if (!managerName || !id) {
        return undefined;
      }

      return dataManager.getPostInfo(managerName, id);
    },
  );

  const date = () => (postInfo() ? getPostDateById(postInfo()!.id) : undefined);
  const refDate = () => {
    const refId = postInfo()?.refId;
    return refId ? getPostDateById(refId) : undefined;
  };
  const alt = () => postInfo()?.tags?.join(' ');

  const postActions = createMemo((): PostAction[] => {
    const info = postInfo();
    return info ? postsManagerDescriptors[info.managerName].actions : [];
  });

  const handleReset = async () => {
    const info = postInfo();
    if (!info) {
      return;
    }

    const result = await messageBox('Are you sure you want to reset current local changes for this post?', [
      'Yes',
      'No',
    ]);
    if (result === 0) {
      dataManager.findPostsManager(info.managerName)?.resetItemPatch(info.id);
    }
  };

  const actions = () => {
    const info = postInfo();
    if (!info) {
      return [];
    }

    return [
      info.status !== 'removed' &&
      (postActions().includes('merge') || postActions().includes('compile')) &&
      props.onSelectedChange
        ? {
            onExecute: () => props.onSelectedChange?.(!props.selected),
            label: props.selected ? 'Unselect' : 'Select',
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('order') && info.type === 'merch'
        ? {
            url: createDetachedDialogFragment('merch-ordering', createPostPath(info.managerName, info.id)),
            label: 'Order',
          }
        : undefined,
      info.status !== 'added'
        ? {
            url: postRoute.createUrl({
              managerName: info.managerName,
              id: info.id,
            }),
            label: 'View',
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('edit')
        ? {
            url: createDetachedDialogFragment('post-editing', createPostPath(info.managerName, info.id)),
            label: 'Edit',
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('precise')
        ? {
            url: createDetachedDialogFragment('post-precising', createPostPath(info.managerName, info.id)),
            label: 'Precise',
          }
        : undefined,
      info.status !== 'removed' && !info.location && postActions().includes('locate')
        ? {
            url: createDetachedDialogFragment('post-location', createPostPath(info.managerName, info.id)),
            label: 'Locate',
          }
        : undefined,
      info.status
        ? {
            label: info.status === 'added' ? 'Remove' : 'Restore',
            onExecute: handleReset,
          }
        : undefined,
    ].filter(Boolean) as TooltipAction[];
  };

  return (
    <Tooltip actions={actions()} onShouldOpenChange={setShouldOpen} {...rest}>
      <Show when={postInfo()}>
        {(postInfo) => (
          <>
            <Show when={local.showContent}>
              <PostContentPreview
                content={postInfo().content}
                aspectRatio={postInfo().aspect}
                maxHeightMultiplier={1.25}
                alt={alt()}
                class={styles.image}
              />
            </Show>
            <span class={styles.title}>{postInfo().title || postInfo().id}</span>
            <Show when={postInfo().titleRu}>
              <span class={styles.titleRu}>{postInfo().titleRu}</span>
            </Show>
            <Show when={postInfo().published}>
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
            <Show when={postInfo().type}>
              <span class={styles.type}>
                {'Type: '}
                <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                  <PostTypeGlyph type={postInfo().type} />
                </Icon>
                {postTypeDescriptors[postInfo().type].title}
              </span>
            </Show>
            <Show when={postInfo().aspect}>
              <span class={styles.type}>
                {'Aspect Ratio: '}
                {aspectRatioToReadableText(postInfo().aspect)}
              </span>
            </Show>
            <Show when={postInfo().authorOptions.length}>
              <span class={styles.author}>
                {'Author: '}
                <For each={postInfo().authorOptions}>
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
            <Show when={postInfo().requesterOption}>
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
            <Show when={postInfo().location}>
              <span class={styles.location}>Location: {asArray(postInfo().location).join(', ')}</span>
            </Show>
            <Show when={postInfo().locatorOption}>
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
            <Show when={postInfo().placement}>
              <span class={styles.placement}>Placement: {postInfo().placement}</span>
            </Show>
            <Show when={postInfo().engine}>
              <span class={styles.engine}>Engine: {postInfo().engine}</span>
            </Show>
            <Show when={postInfo().addon}>
              <span class={styles.addon}>Addon: {postInfo().addon}</span>
            </Show>
            <Show when={postInfo().mark}>
              <span class={styles.mark}>
                {"Editor's Mark: "}
                <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                  {postInfo().mark?.[0]}
                </Icon>
                {postInfo().mark?.[1]}
              </span>
            </Show>
            <Show when={postInfo().violation}>
              <span class={styles.violation}>
                {'Violation: '}
                <For each={asArray(postInfo().violation)}>
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
            <Show when={postInfo().tags?.length}>
              <span class={styles.tags}>Tags: {postInfo().tags?.join(', ')}</span>
            </Show>
            <Show when={isValidDate(postInfo().created)}>
              <span class={styles.created}>Created: {formatDate(postInfo().created!)}</span>
            </Show>
            <Show when={postInfo().rating}>
              <span class={styles.rating}>Rating: {postInfo().rating}</span>
            </Show>
            <Show when={postInfo().likes}>
              <span class={styles.likes}>Likes: {postInfo().likes}</span>
            </Show>
            <Show when={postInfo().views}>
              <span class={styles.views}>Views: {postInfo().views}</span>
            </Show>
            <Show when={postInfo().followers}>
              <span class={styles.views}>Followers: {postInfo().followers}</span>
            </Show>
            <Show when={postInfo().engagement}>
              <span class={styles.engagement}>Engagement: {postInfo().engagement}</span>
            </Show>
            <Show when={postInfo().commentCount}>
              <span class={styles.commentCount}>Comments: {postInfo().commentCount}</span>
            </Show>

            <Show when={isValidDate(refDate()) || postInfo().publishableErrors || postInfo().status}>
              <Divider class={styles.divider} />

              <Show when={isValidDate(refDate())}>
                <span class={styles.date}>* {formatDate(refDate()!)}</span>
              </Show>

              <Show when={postInfo().status}>
                {(status) => (
                  <span class={styles.status}>
                    <Icon color="attribute" size="small" variant="flat">
                      {capitalizeFirstLetter(status())[0]}
                    </Icon>{' '}
                    {capitalizeFirstLetter(status())}
                  </span>
                )}
              </Show>

              <Show when={postInfo().publishableErrors}>
                {(errors) => (
                  <p class={styles.publishableErrors}>
                    <Icon color="attribute" size="small" variant="flat">
                      !
                    </Icon>{' '}
                    {capitalizeFirstLetter(errors().join(', '))}
                  </p>
                )}
              </Show>
            </Show>
          </>
        )}
      </Show>
    </Tooltip>
  );
};

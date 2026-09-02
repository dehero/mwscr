import { type Component, createMemo, createResource, createSignal, For, Show, splitProps } from 'solid-js';
import { aspectRatioToReadableText } from '../../../core/entities/media.js';
import {
  getPostDateById,
  postPlacementDescriptors,
  postTypeDescriptors,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostPath, parsePostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { capitalize } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { postRoute } from '../../routes/post-route.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localField, localize } from '../../utils/intl-utils.js';
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

    const result = await messageBox(localize(texts.editing.resetLocalChanges), [
      localize(texts.common.yes),
      localize(texts.common.no),
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
            label: props.selected ? localize(texts.editing.unselect) : localize(texts.editing.select),
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('order') && info.type === 'merch'
        ? {
            url: createDetachedDialogFragment('merch-ordering', createPostPath(info.managerName, info.id)),
            label: localize(texts.support.order),
          }
        : undefined,
      info.status !== 'added'
        ? {
            url: postRoute.createUrl({
              managerName: info.managerName,
              id: info.id,
            }),
            label: localize(texts.content.view),
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('edit')
        ? {
            url: createDetachedDialogFragment('post-editing', createPostPath(info.managerName, info.id)),
            label: localize(texts.editing.edit),
          }
        : undefined,
      info.status !== 'removed' && postActions().includes('precise')
        ? {
            url: createDetachedDialogFragment('post-precising', createPostPath(info.managerName, info.id)),
            label: localize(texts.editing.precise),
          }
        : undefined,
      info.status !== 'removed' && !info.locationOptions && postActions().includes('locate')
        ? {
            url: createDetachedDialogFragment('post-location', createPostPath(info.managerName, info.id)),
            label: localize(texts.editing.locate),
          }
        : undefined,
      info.status
        ? {
            label: info.status === 'added' ? localize(texts.editing.remove) : localize(texts.editing.restore),
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
            <span class={styles.title}>{localField(postInfo(), 'title') || postInfo().id}</span>
            <Show when={postInfo().titleRu}>
              <span class={styles.titleRu}>{localField(postInfo(), 'title', true)}</span>
            </Show>
            <Show when={postInfo().published}>
              <span class={styles.published}>
                <GoldIcon class={styles.icon} />
                {localize(texts.field.published)}
              </span>
            </Show>
            <Show when={isValidDate(date())}>
              <span class={styles.date}>
                {formatDate(date()!, currentLocale())}
                <Show when={isValidDate(refDate())}>*</Show>
              </span>
            </Show>
            <Show when={postInfo().type}>
              <span class={styles.type}>
                {localize(texts.field.type)}:{' '}
                <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                  <PostTypeGlyph type={postInfo().type} />
                </Icon>
                {localize(postTypeDescriptors[postInfo().type].title)}
              </span>
            </Show>
            <Show when={postInfo().aspect}>
              <span class={styles.type}>
                {localize(texts.field.aspect)}: {aspectRatioToReadableText(postInfo().aspect)}
              </span>
            </Show>
            <Show when={postInfo().authorOptions.length}>
              <span class={styles.author}>
                {localize(texts.field.author)}:{' '}
                <For each={postInfo().authorOptions}>
                  {(option, index) => (
                    <>
                      {index() > 0 ? ', ' : ''}
                      <UserAvatar
                        image={option.image}
                        title={localize(option.label)}
                        size="small"
                        class={styles.avatar}
                      />
                      {localize(option.label)}
                    </>
                  )}
                </For>
              </span>
            </Show>
            <Show when={postInfo().requesterOption}>
              {(option) => (
                <span class={styles.author}>
                  {localize(texts.post.requestedBy)}:{' '}
                  <UserAvatar
                    image={option().image}
                    title={localize(option().label)}
                    size="small"
                    class={styles.avatar}
                  />
                  {localize(option().label)}
                </span>
              )}
            </Show>
            <Show when={postInfo().locationOptions?.length}>
              <span class={styles.location}>
                {localize(texts.field.location)}
                {': '}
                <For each={postInfo().locationOptions}>
                  {(option, index) => (
                    <>
                      {index() > 0 ? '; ' : ''}
                      {localize(option.label)}
                    </>
                  )}
                </For>
              </span>
            </Show>
            <Show when={postInfo().locatorOption}>
              {(option) => (
                <span class={styles.author}>
                  {localize(texts.user.locator)}:{' '}
                  <UserAvatar
                    image={option().image}
                    title={localize(option().label)}
                    size="small"
                    class={styles.avatar}
                  />
                  {localize(option().label)}
                </span>
              )}
            </Show>
            <Show when={postInfo().placement}>
              <span class={styles.placement}>
                {localize(texts.field.placement)}: {localize(postPlacementDescriptors[postInfo().placement!].title)}
              </span>
            </Show>
            <Show when={postInfo().engine}>
              <span class={styles.engine}>
                {localize(texts.field.engine)}: {postInfo().engine}
              </span>
            </Show>
            <Show when={postInfo().addon}>
              <span class={styles.addon}>
                {localize(texts.field.addon)}: {postInfo().addon}
              </span>
            </Show>
            <Show when={postInfo().mark}>
              <span class={styles.mark}>
                {localize(texts.field.mark)}:{' '}
                <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                  {postInfo().mark?.[0]}
                </Icon>
                {postInfo().mark?.[1]}
              </span>
            </Show>
            <Show when={postInfo().violation}>
              <span class={styles.violation}>
                {localize(texts.field.violation)}:{' '}
                <For each={asArray(postInfo().violation)}>
                  {(violation, index) => (
                    <>
                      {index() > 0 ? ', ' : ''}
                      <Icon color="health" size="small" variant="flat" class={styles.icon}>
                        {postViolationDescriptors[violation].letter}
                      </Icon>
                      {localize(postViolationDescriptors[violation].title)}
                    </>
                  )}
                </For>
              </span>
            </Show>
            <Show when={postInfo().tags?.length}>
              <span class={styles.tags}>
                {localize(texts.field.tags)}: {postInfo().tags?.join(', ')}
              </span>
            </Show>
            <Show when={isValidDate(postInfo().created)}>
              <span class={styles.created}>
                {localize(texts.field.created)}: {formatDate(postInfo().created!, currentLocale())}
              </span>
            </Show>
            <Show when={postInfo().rating}>
              <span class={styles.rating}>
                {localize(texts.metrics.rating)}: {postInfo().rating}
              </span>
            </Show>
            <Show when={postInfo().likes}>
              <span class={styles.likes}>
                {localize(texts.metrics.likes)}: {postInfo().likes}
              </span>
            </Show>
            <Show when={postInfo().views}>
              <span class={styles.views}>
                {localize(texts.metrics.views)}: {postInfo().views}
              </span>
            </Show>
            <Show when={postInfo().followers}>
              <span class={styles.views}>
                {localize(texts.metrics.followers)}: {postInfo().followers}
              </span>
            </Show>
            <Show when={postInfo().engagement}>
              <span class={styles.engagement}>
                {localize(texts.metrics.engagement)}: {postInfo().engagement}
              </span>
            </Show>
            <Show when={postInfo().commentCount}>
              <span class={styles.commentCount}>
                {localize(texts.metrics.comments)}: {postInfo().commentCount}
              </span>
            </Show>

            <Show when={isValidDate(refDate()) || postInfo().publishableErrors || postInfo().status}>
              <Divider class={styles.divider} />

              <Show when={isValidDate(refDate())}>
                <span class={styles.date}>* {formatDate(refDate()!, currentLocale())}</span>
              </Show>

              <Show when={postInfo().status}>
                {(status) => (
                  <span class={styles.status}>
                    <Icon color="attribute" size="small" variant="flat">
                      {capitalize(status())[0]}
                    </Icon>{' '}
                    {capitalize(status())}
                  </span>
                )}
              </Show>

              <Show when={postInfo().publishableErrors}>
                {(errors) => (
                  <p class={styles.publishableErrors}>
                    <Icon color="attribute" size="small" variant="flat">
                      !
                    </Icon>{' '}
                    {capitalize(errors().join(', '))}
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

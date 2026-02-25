import clsx from 'clsx';
import { type Component, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import avatar from '../../../../assets/avatar.png?format=avif&imagetools';
import { markdownToInlineHtml } from '../../../core/entities/markdown.js';
import { getLimitedAspectRatio } from '../../../core/entities/media.js';
import { postAddonDescriptors, postViolationDescriptors } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostPath } from '../../../core/entities/posts-manager.js';
import { asArray, capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { postRoute } from '../../routes/post-route.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Markdown } from '../Markdown/Markdown.jsx';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { PostTypeGlyph } from '../PostTypeGlyph/PostTypeGlyph.jsx';
import { Spacer } from '../Spacer/Spacer.js';
import styles from './PostPreview.module.css';

export const POST_PREVIEW_MAX_WIDTH = 324;
export const POST_PREVIEW_INFO_MIN_HEIGHT = 30;
export const POST_PREVIEW_GAP = 3;

export interface PostPreviewProps {
  class?: string;
  postInfo: PostInfo;
  maxHeightMultiplier?: number;
  toggleSelectedOnClick?: boolean;
  selected?: boolean;
  onSelectedChange?: (value: boolean) => void;
}

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const title = () => props.postInfo.title || props.postInfo.id;

  const url = () =>
    props.postInfo.status === 'added'
      ? createDetachedDialogFragment('post-editing', createPostPath(props.postInfo.managerName, props.postInfo.id))
      : postRoute.createUrl({ managerName: props.postInfo.managerName, id: props.postInfo.id });
  const minHeightMultiplier = () => (props.postInfo.description ? undefined : 1);
  const aspectRatio = () =>
    getLimitedAspectRatio(props.postInfo.aspect ?? '1/1', minHeightMultiplier(), props.maxHeightMultiplier);
  const alt = () => props.postInfo.tags?.join(' ');
  const frameState = () => (props.selected ? 'selected' : props.postInfo.status ? 'unsaved' : undefined);

  const description = () => props.postInfo.description ?? props.postInfo.descriptionRu ?? '';
  const hasRenderableDescription = () => markdownToInlineHtml(description(), () => []).html.length > 0;

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <Dynamic
      component={props.toggleSelectedOnClick ? 'div' : 'a'}
      class={clsx(styles.container, props.class, props.postInfo.status === 'removed' && styles.removed)}
      ref={setRef}
      href={props.toggleSelectedOnClick ? undefined : url()}
      onClick={props.toggleSelectedOnClick ? () => props.onSelectedChange?.(!props.selected) : undefined}
    >
      <Show
        when={props.postInfo.status !== 'removed'}
        fallback={
          <Frame variant="thin" state={frameState()} class={styles.request} style={{ 'aspect-ratio': aspectRatio() }}>
            <span class={styles.status}>
              <Icon color="attribute" size="small" variant="flat">
                {capitalizeFirstLetter(props.postInfo.status!)[0]}
              </Icon>{' '}
              {capitalizeFirstLetter(props.postInfo.status!)}
            </span>
          </Frame>
        }
      >
        <PostContentPreview
          class={styles.image}
          content={props.postInfo.content ?? props.postInfo.snapshot ?? (!props.postInfo.request ? avatar : undefined)}
          aspectRatio={props.postInfo.aspect}
          alt={alt()}
          frameState={frameState()}
          minHeightMultiplier={minHeightMultiplier()}
          maxHeightMultiplier={props.maxHeightMultiplier}
          fallback={
            <Show when={props.postInfo.request}>
              {(request) => (
                <Frame
                  variant="thin"
                  state={frameState()}
                  class={styles.request}
                  style={{ 'aspect-ratio': aspectRatio() }}
                >
                  <p class={styles.requestText}>{request().text}</p>

                  <Show when={props.postInfo.requesterOption}>
                    {(option) => <p class={styles.requestUser}>{option().label}</p>}
                  </Show>
                </Frame>
              )}
            </Show>
          }
        />
      </Show>

      <Show when={title() || props.postInfo.rating}>
        <Frame variant="thin" state={frameState()} class={styles.info}>
          <div class={styles.header}>
            <div class={styles.title}>{title()}</div>
            <Show when={props.postInfo.refId}>*</Show>
            <Spacer />
            <Show when={props.postInfo.published}>
              <GoldIcon class={styles.publishedIcon} />
            </Show>

            <Show when={props.postInfo.engagement}>
              <span class={styles.engagement}>{props.postInfo.engagement}</span>
            </Show>

            <Show when={props.postInfo.status !== 'removed'}>
              <div class={styles.attributes}>
                <Show when={props.postInfo.addon && !postAddonDescriptors[props.postInfo.addon].official}>
                  <span class={styles.addon}>{props.postInfo.addon}</span>
                </Show>

                <Frame class={styles.icons}>
                  <Icon color="combat" size="small" variant="flat">
                    <PostTypeGlyph type={props.postInfo.type} />
                  </Icon>

                  <Show when={props.postInfo.mark}>
                    <Icon color="combat" size="small" variant="flat">
                      {props.postInfo.mark?.[0]}
                    </Icon>
                  </Show>

                  <For each={asArray(props.postInfo.violation)}>
                    {(violation) => (
                      <Icon color="health" size="small" variant="flat">
                        {postViolationDescriptors[violation].letter}
                      </Icon>
                    )}
                  </For>

                  <Show when={props.postInfo.status}>
                    {(status) => (
                      <Icon color="attribute" size="small" variant="flat">
                        {capitalizeFirstLetter(status())[0]}
                      </Icon>
                    )}
                  </Show>

                  <Show when={props.postInfo.publishableErrors}>
                    <Icon color="attribute" size="small" variant="flat">
                      !
                    </Icon>
                  </Show>
                </Frame>
              </div>
            </Show>
          </div>
          <Show when={hasRenderableDescription()}>
            <Divider />
            <div class={styles.description}>
              <Markdown disableLinks>{description()}</Markdown>
            </div>
          </Show>
        </Frame>
      </Show>
      <PostTooltip
        forRef={ref()}
        postInfo={props.postInfo}
        selected={props.selected}
        onSelectedChange={props.onSelectedChange}
      />
    </Dynamic>
  );
};

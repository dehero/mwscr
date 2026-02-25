import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { For, Match, Show, Switch } from 'solid-js';
import { getLimitedAspectRatio } from '../../../core/entities/media.js';
import type { PostAspectRatio, PostContent } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import type { FrameState } from '../Frame/Frame.jsx';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import styles from './PostContentPreview.module.css';

export interface PostContentPreviewProps {
  content: PostContent | undefined;
  aspectRatio: PostAspectRatio | undefined;
  minHeightMultiplier?: number;
  maxHeightMultiplier?: number;
  alt?: string;
  fallback?: JSX.Element;
  class?: string;
  frameState?: FrameState;
}

export const PostContentPreview: Component<PostContentPreviewProps> = (props) => {
  const content = () => asArray(props.content).slice(0, 4);
  const aspectRatio = () =>
    props.aspectRatio
      ? getLimitedAspectRatio(props.aspectRatio, props.minHeightMultiplier, props.maxHeightMultiplier)
      : undefined;
  const alignCrop = () => (props.aspectRatio ? 'center' : 'top');

  return (
    <Show when={content().length > 0} fallback={props.fallback}>
      <Switch
        fallback={
          <ResourcePreview
            url={content()[0] || ''}
            aspectRatio={aspectRatio()}
            class={props.class}
            alt={props.alt}
            frameState={props.frameState}
            alignCrop={alignCrop()}
          />
        }
      >
        <Match when={content().length === 3}>
          <div class={clsx(props.class, styles.tripleContainer)}>
            <For each={content()}>
              {(url) => <ResourcePreview url={url} class={styles.tripleItem} frameState={props.frameState} />}
            </For>
          </div>
        </Match>
        <Match when={content().length > 3}>
          <div class={clsx(props.class, styles.setContainer)}>
            <For each={content()}>
              {(url) => (
                <ResourcePreview url={url} class={styles.setItem} aspectRatio="1/1" frameState={props.frameState} />
              )}
            </For>
          </div>
        </Match>
      </Switch>
    </Show>
  );
};

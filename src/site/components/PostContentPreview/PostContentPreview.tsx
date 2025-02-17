import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import { getLimitedAspectRatio } from '../../../core/entities/media.js';
import type { PostContent, PostType } from '../../../core/entities/post.js';
import { postTypeDescriptors } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import type { FrameState } from '../Frame/Frame.jsx';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import styles from './PostContentPreview.module.css';

export interface PostContentPreviewProps {
  content: PostContent | undefined;
  type: PostType;
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
    getLimitedAspectRatio(
      postTypeDescriptors[props.type].aspectRatio,
      props.minHeightMultiplier,
      props.maxHeightMultiplier,
    );

  return (
    <Show when={content().length > 0} fallback={props.fallback}>
      <Show
        when={content().length > 2}
        fallback={
          <ResourcePreview
            url={content()[0] || ''}
            aspectRatio={aspectRatio()}
            class={props.class}
            alt={props.alt}
            frameState={props.frameState}
          />
        }
      >
        <div class={clsx(props.class, styles.setContainer)}>
          <For each={content()}>
            {(url) => (
              <ResourcePreview url={url} class={styles.setItem} aspectRatio="1/1" frameState={props.frameState} />
            )}
          </For>
        </div>
      </Show>
    </Show>
  );
};

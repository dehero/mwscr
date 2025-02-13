import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import type { PostContent, PostType } from '../../../core/entities/post.js';
import { getPostTypeAspectRatio } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import type { FrameState } from '../Frame/Frame.jsx';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import styles from './PostContentPreview.module.css';

export interface PostContentPreviewProps {
  content: PostContent | undefined;
  type: PostType;
  alt?: string;
  fallback?: JSX.Element;
  class?: string;
  frameState?: FrameState;
  maxHeightMultiplier?: number;
}

export const PostContentPreview: Component<PostContentPreviewProps> = (props) => {
  const content = () => asArray(props.content).slice(0, 4);
  const aspectRatio = () => getPostTypeAspectRatio(props.type);

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
            maxHeightMultiplier={props.maxHeightMultiplier}
            state={props.frameState}
          />
        }
      >
        <div class={clsx(props.class, styles[props.type], styles.setContainer)}>
          <For each={content()}>
            {(url) => <ResourcePreview url={url} class={styles.setItem} aspectRatio="1/1" state={props.frameState} />}
          </For>
        </div>
      </Show>
    </Show>
  );
};

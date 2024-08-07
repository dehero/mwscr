import clsx from 'clsx';
import type { Component } from 'solid-js';
import { Match, onMount, Show, Switch } from 'solid-js';
import type { MediaAspectRatio } from '../../../core/entities/media.js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import { getResourcePreviewUrl } from '../../data-managers/resources.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { Frame } from '../Frame/Frame.js';
import { useToaster } from '../Toaster/Toaster.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './ResourcePreview.module.css';

export interface ResourcePreviewProps {
  url: string;
  class?: string;
  onLoad?: () => void;
  onError?: () => void;
  showTooltip?: boolean;
  aspectRatio?: MediaAspectRatio;
  alt?: string;
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const { addToast } = useToaster();
  const parsedUrl = () => parseResourceUrl(props.url);
  const src = () => getResourcePreviewUrl(props.url);
  let ref: HTMLObjectElement | undefined;

  const handleError = () => {
    addToast(`Failed to load preview: ${src()}`);
    props.onError?.();
  };

  onMount(() => {
    const data = src();
    if (ref && data) {
      // Force trigger onLoad event after hydration by changing data
      ref.data = data;
    }
  });

  return (
    <Switch
      fallback={
        <Frame
          variant="thin"
          class={clsx(styles.fallback, props.class)}
          style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
        >
          <span class={styles.url}>{props.url}</span>
        </Frame>
      }
    >
      <Match when={parsedUrl().protocol === 'store:'}>
        <Frame
          component="object"
          data={src()}
          ref={ref}
          class={clsx(styles.preview, props.class)}
          draggable="false"
          onLoad={props.onLoad}
          onError={handleError}
          style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
          aria-label={props.alt || props.url}
        >
          <img src={YellowExclamationMark} class={styles.preview} alt="yellow exclamation mark" />
        </Frame>

        <Show when={props.showTooltip}>
          <Tooltip forRef={ref}>{props.url}</Tooltip>
        </Show>
      </Match>
    </Switch>
  );
};

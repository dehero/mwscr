import clsx from 'clsx';
import type { Component } from 'solid-js';
import { Match, onMount, Show, Switch } from 'solid-js';
import { getAspectRatioHeightMultiplier, type MediaAspectRatio } from '../../../core/entities/media.js';
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
  maxHeightMultiplier?: number;
  alt?: string;
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const { addToast } = useToaster();
  const parsedUrl = () => parseResourceUrl(props.url);
  const url = () => getResourcePreviewUrl(props.url);
  let ref: HTMLImageElement | undefined;

  const handleLoad = () => {
    if (ref?.src !== YellowExclamationMark) {
      props.onLoad?.();
    }
  };

  const handleError = () => {
    addToast(`Failed to load preview: ${url()}`);
    if (ref && ref.src !== YellowExclamationMark) {
      ref.src = YellowExclamationMark;
    }
    props.onError?.();
  };

  onMount(() => {
    const src = url();
    if (ref && src) {
      // Force trigger onLoad event after hydration by changing src
      ref.src = src;
    }
  });

  const needBlurredBackground = () =>
    props.aspectRatio && props.maxHeightMultiplier
      ? props.maxHeightMultiplier < getAspectRatioHeightMultiplier(props.aspectRatio)
      : false;

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
        <Show
          when={needBlurredBackground()}
          fallback={
            <Frame
              component="img"
              src={url()}
              ref={ref}
              class={clsx(styles.preview, props.class)}
              draggable="false"
              onLoad={handleLoad}
              onError={handleError}
              style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
              aria-label={url() === YellowExclamationMark ? 'yellow exclamation mark' : props.alt || props.url}
            />
          }
        >
          <Frame class={clsx(styles.blurredBackgroundWrapper, props.class)}>
            <img
              src={url()}
              class={styles.blurredBackground}
              draggable="false"
              style={{ 'aspect-ratio': `1 / ${props.maxHeightMultiplier ?? 1}` }}
            />

            <img
              src={url()}
              ref={ref}
              class={styles.preview}
              draggable="false"
              onLoad={handleLoad}
              onError={handleError}
              style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
              aria-label={url() === YellowExclamationMark ? 'yellow exclamation mark' : props.alt || props.url}
            />
          </Frame>
        </Show>

        <Show when={props.showTooltip}>
          <Tooltip forRef={ref}>{props.url}</Tooltip>
        </Show>
      </Match>
    </Switch>
  );
};

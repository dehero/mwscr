import clsx from 'clsx';
import { type Component, Match, onMount, Show, Switch } from 'solid-js';
import YellowExclamationMark from '../../../../assets/images/exclamation.svg';
import type { MediaAspectRatio } from '../../../core/entities/media.js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import { Frame } from '../Frame/Frame.js';
import frameStyles from '../Frame/Frame.module.css';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './ResourcePreview.module.css';

export function getStorePreviewUrl(url: string | undefined) {
  return url?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif');
}

export interface ResourcePreviewProps {
  url: string;
  class?: string;
  onLoad?: () => void;
  showTooltip?: boolean;
  aspectRatio?: MediaAspectRatio;
  alt?: string;
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const parsedUrl = () => parseResourceUrl(props.url);
  const src = () => getStorePreviewUrl(props.url);
  let ref: HTMLObjectElement | undefined;
  let fallbackImageRef: HTMLImageElement | undefined;

  onMount(() => {
    // Check if image is already loaded
    if (props.onLoad && !fallbackImageRef?.complete) {
      props.onLoad();
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
        <object
          data={src()}
          ref={ref}
          class={clsx(frameStyles.thin, styles.preview, props.class)}
          draggable="false"
          onLoad={props.onLoad}
          style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
          aria-label={props.alt || props.url}
        >
          <img
            src={YellowExclamationMark}
            class={styles.preview}
            ref={fallbackImageRef}
            alt="yellow exclamation mark"
          />
        </object>

        <Show when={props.showTooltip}>
          <Tooltip forRef={ref}>{props.url}</Tooltip>
        </Show>
      </Match>
    </Switch>
  );
};

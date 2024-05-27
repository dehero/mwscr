import clsx from 'clsx';
import { type Component, Match, Show, Switch } from 'solid-js';
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
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const parsedUrl = parseResourceUrl(props.url);
  let ref: HTMLImageElement | undefined;

  return (
    <Switch
      fallback={
        <Frame variant="thin" class={clsx(styles.fallback, props.class)}>
          {props.url}
        </Frame>
      }
    >
      <Match when={parsedUrl.protocol === 'store:'}>
        <img
          ref={ref}
          src={getStorePreviewUrl(props.url)}
          class={clsx(frameStyles.thin, styles.preview, props.class)}
          draggable="false"
          onLoad={props.onLoad}
          style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
        />
        <Show when={props.showTooltip}>
          <Tooltip forRef={ref}>{props.url}</Tooltip>
        </Show>
      </Match>
    </Switch>
  );
};

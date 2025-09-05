import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import type { Component } from 'solid-js';
import { mergeProps, onMount, Show } from 'solid-js';
import type { MediaAspectRatio } from '../../../core/entities/media.js';
// import { parseResourceUrl } from '../../../core/entities/resource.js';
import { getResourcePreviewUrl } from '../../data-managers/resources.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import type { FrameState } from '../Frame/Frame.js';
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
  frameState?: FrameState;
  alignCrop?: 'center' | 'top';
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const merged = mergeProps({ alignCrop: 'center' }, props);

  const { addToast } = useToaster();
  // const parsedUrl = () => parseResourceUrl(props.url);
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

  const copyUrl = () => {
    writeClipboard(props.url);
    addToast('Resource URL copied to clipboard');
  };

  return (
    <Show when={url()} keyed>
      {(url) => (
        // <Switch
        //   fallback={
        //     <Frame
        //       variant="thin"
        //       class={clsx(styles.fallback, props.class)}
        //       style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
        //       state={props.frameState}
        //     >
        //       <span class={styles.url}>{props.url}</span>
        //     </Frame>
        //   }
        // >
        // {/* <Match when={parsedUrl().protocol === 'store:'}> */}
        <>
          <Frame
            component="img"
            src={url}
            ref={ref}
            class={clsx(styles.preview, merged.alignCrop && styles[merged.alignCrop], props.class)}
            draggable="false"
            onLoad={handleLoad}
            onError={handleError}
            style={props.aspectRatio ? { 'aspect-ratio': props.aspectRatio } : undefined}
            aria-label={url === YellowExclamationMark ? 'yellow exclamation mark' : props.alt || props.url}
            state={props.frameState}
          />
          <Show when={props.showTooltip}>
            <Tooltip forRef={ref} actions={[{ label: 'Copy', onExecute: copyUrl }]}>
              {props.url}
            </Tooltip>
          </Show>
        </>
        // {/* </Match> */}
        // </Switch>
      )}
    </Show>
  );
};

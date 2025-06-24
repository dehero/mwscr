import clsx from 'clsx';
import { type Component, onMount, Show } from 'solid-js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import { store } from '../../../core/stores/index.js';
import { getResourcePreviewUrl } from '../../data-managers/resources.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  image: string | undefined;
  title: string;
  class?: string;
  onLoad?: () => void;
  onError?: () => void;
  original?: boolean;
}

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  const { addToast } = useToaster();
  let ref: HTMLImageElement | undefined;

  const url = () =>
    props.image
      ? props.original
        ? store.getPublicUrl(parseResourceUrl(props.image).pathname)
        : getResourcePreviewUrl(props.image)
      : undefined;

  const handleLoad = () => {
    if (ref instanceof HTMLImageElement && ref.src !== YellowExclamationMark) {
      props.onLoad?.();
    }
  };

  const handleError = () => {
    addToast(props.original ? `Failed to load: ${url()}` : `Failed to load preview: ${url()}`);
    if (ref instanceof HTMLImageElement && ref.src !== YellowExclamationMark) {
      ref.src = YellowExclamationMark;
      ref.ariaLabel = 'yellow exclamation mark';
    }
    props.onError?.();
  };

  onMount(() => {
    const src = url();
    if (ref instanceof HTMLImageElement && src) {
      // Force trigger onLoad event after hydration by changing src
      ref.src = src;
    }
  });

  return (
    <Show
      when={url()}
      fallback={
        <div
          class={clsx(props.class, styles.avatar, styles.fallback, props.original && styles.original)}
          aria-label={props.title}
        >
          {props.title[0]?.toLocaleUpperCase()}
        </div>
      }
      keyed
    >
      <img
        src={url()}
        class={clsx(props.class, styles.avatar)}
        draggable="false"
        onLoad={handleLoad}
        onError={handleError}
        aria-label={props.title}
        ref={ref}
      />
    </Show>
  );
};

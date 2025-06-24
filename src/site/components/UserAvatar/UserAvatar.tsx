import clsx from 'clsx';
import { type Component, onMount, Show } from 'solid-js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import { getUserTitleLetter } from '../../../core/entities/user.js';
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
  size?: 'small' | 'medium' | 'original';
}

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  const { addToast } = useToaster();
  let ref: HTMLImageElement | undefined;

  const url = () =>
    props.image
      ? props.size === 'original'
        ? store.getPublicUrl(parseResourceUrl(props.image).pathname)
        : getResourcePreviewUrl(props.image)
      : undefined;

  const handleLoad = () => {
    if (ref instanceof HTMLImageElement && ref.src !== YellowExclamationMark) {
      props.onLoad?.();
    }
  };

  const handleError = () => {
    addToast(props.size === 'original' ? `Failed to load: ${url()}` : `Failed to load preview: ${url()}`);
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
          // eslint-disable-next-line unicorn/explicit-length-check
          class={clsx(props.class, styles.avatar, styles.fallback, props.size && styles[props.size])}
          aria-label={props.title}
        >
          {getUserTitleLetter(props.title)}
        </div>
      }
      keyed
    >
      <img
        src={url()}
        // eslint-disable-next-line unicorn/explicit-length-check
        class={clsx(props.class, styles.avatar, props.size && styles[props.size])}
        draggable="false"
        onLoad={handleLoad}
        onError={handleError}
        aria-label={props.title}
        ref={ref}
      />
    </Show>
  );
};

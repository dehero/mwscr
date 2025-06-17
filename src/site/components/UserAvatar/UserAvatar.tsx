import clsx from 'clsx';
import { type Component, onMount, Show } from 'solid-js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { store } from '../../../core/stores/index.js';
import { getResourcePreviewUrl } from '../../data-managers/resources.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  userInfo: UserInfo;
  class?: string;
  onLoad?: () => void;
  onError?: () => void;
  original?: boolean;
}

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  const { addToast } = useToaster();
  let ref: HTMLImageElement | undefined;

  const url = () =>
    props.userInfo.avatar
      ? props.original
        ? store.getPublicUrl(parseResourceUrl(props.userInfo.avatar).pathname)
        : getResourcePreviewUrl(props.userInfo.avatar)
      : undefined;

  const handleLoad = () => {
    if (ref?.src !== YellowExclamationMark) {
      props.onLoad?.();
    }
  };

  const handleError = () => {
    addToast(props.original ? `Failed to load: ${url()}` : `Failed to load preview: ${url()}`);
    if (ref && ref.src !== YellowExclamationMark) {
      ref.src = YellowExclamationMark;
      ref.ariaLabel = 'yellow exclamation mark';
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

  return (
    <Show
      when={url()}
      fallback={
        <div
          class={clsx(props.class, styles.avatar, styles.fallback, props.original && styles.original)}
          aria-label={props.userInfo.title}
        >
          {props.userInfo.title[0]?.toLocaleUpperCase()}
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
        aria-label={props.userInfo.title}
        ref={ref}
      />
    </Show>
  );
};

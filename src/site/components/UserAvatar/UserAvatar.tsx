import clsx from 'clsx';
import { type Component, createResource, onMount, Show } from 'solid-js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { store } from '../../../core/stores/index.js';
import { dataManager } from '../../data-managers/manager.js';
import { getResourcePreviewUrl } from '../../data-managers/resources.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  user: UserInfo | string;
  class?: string;
  onLoad?: () => void;
  onError?: () => void;
  original?: boolean;
}

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  const { addToast } = useToaster();
  let ref: HTMLImageElement | undefined;

  const [userInfo] = createResource(
    () => props.user,
    (user) => (typeof user === 'string' ? dataManager.getUserInfo(user) : user),
  );

  const url = () =>
    userInfo()?.avatar
      ? props.original
        ? store.getPublicUrl(parseResourceUrl(userInfo()!.avatar!).pathname)
        : getResourcePreviewUrl(userInfo()!.avatar!)
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
          aria-label={userInfo()?.title}
        >
          {userInfo()?.title[0]?.toLocaleUpperCase()}
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
        aria-label={userInfo()?.title}
        ref={ref}
      />
    </Show>
  );
};

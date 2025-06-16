import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import styles from './UserAvatar.module.css';

export interface UserAvatarProps {
  class?: string;
  userInfo: UserInfo;
}

export const UserAvatar: Component<UserAvatarProps> = (props) => {
  return (
    <Show
      when={props.userInfo.avatar}
      fallback={
        <div class={clsx(props.class, styles.avatar, styles.fallback)}>
          {props.userInfo.title[0]?.toLocaleUpperCase()}
        </div>
      }
    >
      {(avatar) => <ResourcePreview url={avatar()} class={clsx(props.class, styles.avatar)} />}
    </Show>
  );
};

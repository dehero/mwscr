import clsx from 'clsx';
import { type Component, createSignal, Show } from 'solid-js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { userRoute } from '../../routes/user-route.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { UserTooltip } from '../UserTooltip/UserTooltip.js';
import styles from './UserPreview.module.css';

export interface UserPreviewProps {
  class?: string;
  userInfo: UserInfo;
}

export const UserPreview: Component<UserPreviewProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLElement>();
  const url = () => userRoute.createUrl({ id: props.userInfo.id });

  return (
    <Frame component="a" class={clsx(styles.container, props.class)} ref={setRef} href={url()}>
      <Icon class={styles.icon} color={props.userInfo.roles.includes('author') ? 'stealth' : 'magic'}>
        {props.userInfo.title[0]?.toLocaleUpperCase()}
      </Icon>

      <span class={styles.title}>{props.userInfo.title}</span>

      <Show when={props.userInfo.authored?.posts}>
        <span class={styles.published}>
          <GoldIcon />
          {props.userInfo.authored!.posts}
        </span>
      </Show>

      <span class={styles.roles}>{props.userInfo.roles.join(', ')}</span>

      <UserTooltip forRef={ref()} user={props.userInfo} />
    </Frame>
  );
};

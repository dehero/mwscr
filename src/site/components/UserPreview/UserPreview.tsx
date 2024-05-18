import clsx from 'clsx';
import { type Component, createSignal, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { UserInfo } from '../../../core/entities/user.js';
import frameStyles from '../Frame/Frame.module.css';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { UserTooltip } from '../UserTooltip/UserTooltip.js';
import styles from './UserPreview.module.css';

export interface UserPreviewProps {
  class?: string;
  userInfo: UserInfo;
  url?: string;
}

export const UserPreview: Component<UserPreviewProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <Dynamic
      component={props.url ? 'a' : 'div'}
      class={clsx(frameStyles.thin, styles.container, props.class)}
      ref={setRef}
      href={props.url}
    >
      <Icon class={styles.icon} color={props.userInfo.roles.includes('author') ? 'stealth' : 'magic'}>
        {props.userInfo.title[0]?.toLocaleUpperCase()}
      </Icon>

      <span class={styles.title}>{props.userInfo.title}</span>

      <Show when={props.userInfo.authored.published > 0}>
        <span class={styles.published}>
          <GoldIcon />
          {props.userInfo.authored.published}
        </span>
      </Show>

      <span class={styles.roles}>{props.userInfo.roles.join(', ')}</span>

      <UserTooltip forRef={ref()} userInfo={props.userInfo} />
    </Dynamic>
  );
};

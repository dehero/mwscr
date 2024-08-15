import { type Component, Show, splitProps } from 'solid-js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { userContributionToString } from '../../../core/entities/user-info.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './UserTooltip.module.css';

interface UserTooltipProps extends Omit<TooltipProps, 'children'> {
  userInfo: UserInfo;
}

export const UserTooltip: Component<UserTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['userInfo']);
  const authored = () => userContributionToString(local.userInfo.authored);
  const requested = () => userContributionToString(local.userInfo.requested);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>
        <Icon
          size="small"
          variant="flat"
          color={local.userInfo.roles.includes('author') ? 'stealth' : 'magic'}
          class={styles.icon}
        >
          {local.userInfo.title[0]?.toLocaleUpperCase() || '?'}
        </Icon>
        {local.userInfo.title}
      </span>

      <Show when={local.userInfo.roles.length > 0}>
        <span class={styles.roles}>Roles: {local.userInfo.roles.join(', ')}</span>
      </Show>
      <Show when={authored()}>
        <span class={styles.contribution}>
          {'Authored: '}
          <Show when={local.userInfo.authored.posted > 0}>
            <GoldIcon class={styles.icon} />
          </Show>
          {authored()}
        </span>
      </Show>
      <Show when={requested()}>
        <span>Requested: {requested()}</span>
      </Show>
      <Show when={local.userInfo.likes > 0}>
        <span>Likes: {local.userInfo.likes}</span>
      </Show>
    </Tooltip>
  );
};

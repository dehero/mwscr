import { type Component, createResource, Show, splitProps } from 'solid-js';
import { postsUsageToString } from '../../../core/entities/posts-usage.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { dataManager } from '../../data-managers/manager.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import styles from './UserTooltip.module.css';

interface UserTooltipProps extends Omit<TooltipProps, 'children'> {
  user: UserInfo | string | undefined;
  showAvatar?: boolean;
}

export const UserTooltip: Component<UserTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['user']);

  const [userInfo] = createResource(
    () => local.user,
    (user) => (typeof user === 'string' ? dataManager.getUserInfo(user) : user),
  );

  const authored = () => postsUsageToString(userInfo()?.authored);
  const located = () => postsUsageToString(userInfo()?.located);
  const requested = () => postsUsageToString(userInfo()?.requested);
  const commented = () => postsUsageToString(userInfo()?.commented);

  return (
    <Show when={userInfo()}>
      {(userInfo) => (
        <Tooltip {...rest}>
          <Show when={props.showAvatar}>
            <UserAvatar class={styles.avatar} image={userInfo().avatar} title={userInfo().title} size="medium" />
          </Show>

          <span class={styles.title}>{userInfo().title}</span>

          <Show when={userInfo().titleRu && userInfo().titleRu !== userInfo().title}>
            <span class={styles.titleRu}>{userInfo().titleRu}</span>
          </Show>

          <Show when={userInfo().roles.length > 0}>
            <span class={styles.roles}>{userInfo().roles.join(', ')}</span>
          </Show>
          <Show when={authored()}>
            <span class={styles.contribution}>
              {'Authored: '}
              <Show when={userInfo().authored?.posts || userInfo().authored?.extras}>
                <GoldIcon class={styles.icon} />
              </Show>
              {authored()}
            </span>
          </Show>
          <Show when={located()}>
            <span>Located: {authored()}</span>
          </Show>
          <Show when={requested()}>
            <span>Requested: {requested()}</span>
          </Show>
          <Show when={commented()}>
            <span>Commented: {commented()}</span>
          </Show>
          <Show when={userInfo().mark}>
            <span class={styles.mark}>
              {"Editor's Mark: "}
              <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                {userInfo().mark?.[0]}
              </Icon>
              {userInfo().mark?.[1]}
            </span>
          </Show>
          <Show when={userInfo().rating > 0}>
            <span>Rating: {userInfo().rating}</span>
          </Show>
          <Show when={userInfo().likes > 0}>
            <span>Likes: {userInfo().likes}</span>
          </Show>
          <Show when={userInfo().views > 0}>
            <span>Views: {userInfo().views}</span>
          </Show>
          <Show when={userInfo().engagement > 0}>
            <span>Engagement: {userInfo().engagement}</span>
          </Show>
          <Show when={userInfo().talkedToTelegramBot}>
            <span class={styles.talkedToTelegramBot}>Talked to Ordinator</span>
          </Show>
        </Tooltip>
      )}
    </Show>
  );
};

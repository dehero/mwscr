import { type Component, createResource, Show, splitProps } from 'solid-js';
import { postsUsageToString } from '../../../core/entities/posts-usage.js';
import { userRoleDescriptors } from '../../../core/entities/user.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { dataManager } from '../../data-managers/manager.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localField, localize } from '../../utils/intl-utils.js';
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

  const title = () => localField(userInfo(), 'title');
  const secondaryTitle = () => localField(userInfo(), 'title', true);
  const authored = () => postsUsageToString(userInfo()?.authored, currentLocale());
  const located = () => postsUsageToString(userInfo()?.located, currentLocale());
  const requested = () => postsUsageToString(userInfo()?.requested, currentLocale());
  const commented = () => postsUsageToString(userInfo()?.commented, currentLocale());

  return (
    <Show when={userInfo()}>
      {(userInfo) => (
        <Tooltip {...rest}>
          <Show when={props.showAvatar}>
            <UserAvatar class={styles.avatar} image={userInfo().avatar} title={userInfo().title} size="medium" />
          </Show>

          <span class={styles.title}>{title()}</span>

          <Show when={secondaryTitle() && secondaryTitle() !== title()}>
            <span class={styles.titleRu}>{secondaryTitle()}</span>
          </Show>

          <Show when={userInfo().roles.length > 0}>
            <span class={styles.roles}>
              {userInfo()
                .roles.map((role) => localize(userRoleDescriptors[role].title).toLocaleLowerCase())
                .join(', ')}
            </span>
          </Show>
          <Show when={authored()}>
            <span class={styles.contribution}>
              {localize(texts.metrics.authored)}:{' '}
              <Show when={userInfo().authored?.posts || userInfo().authored?.extras}>
                <GoldIcon class={styles.icon} />
              </Show>
              {authored()}
            </span>
          </Show>
          <Show when={located()}>
            <span>
              {localize(texts.post.located)}: {located()}
            </span>
          </Show>
          <Show when={requested()}>
            <span>
              {localize(texts.post.requested)}: {requested()}
            </span>
          </Show>
          <Show when={commented()}>
            <span>
              {localize(texts.metrics.commented)}: {commented()}
            </span>
          </Show>
          <Show when={userInfo().mark}>
            <span class={styles.mark}>
              {localize(texts.field.mark)}:{' '}
              <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                {userInfo().mark?.[0]}
              </Icon>
              {userInfo().mark?.[1]}
            </span>
          </Show>
          <Show when={userInfo().rating > 0}>
            <span>
              {localize(texts.metrics.rating)}: {userInfo().rating}
            </span>
          </Show>
          <Show when={userInfo().likes > 0}>
            <span>
              {localize(texts.metrics.likes)}: {userInfo().likes}
            </span>
          </Show>
          <Show when={userInfo().views > 0}>
            <span>
              {localize(texts.metrics.views)}: {userInfo().views}
            </span>
          </Show>
          <Show when={userInfo().engagement > 0}>
            <span>
              {localize(texts.metrics.engagement)}: {userInfo().engagement}
            </span>
          </Show>
          <Show when={userInfo().talkedToTelegramBot}>
            <span class={styles.talkedToTelegramBot}>{localize(texts.user.talkedToOrdinator)}</span>
          </Show>
        </Tooltip>
      )}
    </Show>
  );
};

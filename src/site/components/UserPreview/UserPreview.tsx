import clsx from 'clsx';
import { type Component, createSignal, Show } from 'solid-js';
import { userRoleDescriptors } from '../../../core/entities/user.ts';
import type { UserInfo } from '../../../core/entities/user-info.ts';
import { userRoute } from '../../routes/user-route.ts';
import { localField, localize } from '../../utils/intl-utils.ts';
import { Frame } from '../Frame/Frame.tsx';
import { GoldIcon } from '../GoldIcon/GoldIcon.tsx';
import { UserAvatar } from '../UserAvatar/UserAvatar.tsx';
import { UserTooltip } from '../UserTooltip/UserTooltip.tsx';
import styles from './UserPreview.module.css';

export const USER_PREVIEW_MAX_WIDTH = 204;
export const USER_PREVIEW_HEIGHT = 204;

export interface UserPreviewProps {
  class?: string;
  userInfo: UserInfo;
}

export const UserPreview: Component<UserPreviewProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLElement>();
  const url = () => userRoute.createUrl({ id: props.userInfo.id });
  const authored = () => (props.userInfo.authored?.posts ?? 0) + (props.userInfo.authored?.extras ?? 0);

  return (
    <Frame component="a" class={clsx(styles.container, props.class)} ref={setRef} href={url()}>
      <UserAvatar class={styles.avatar} image={props.userInfo.avatar} title={props.userInfo.title} />

      <section class={styles.info}>
        <span class={styles.title}>{localField(props.userInfo, 'title')}</span>

        <span class={styles.roles}>
          {props.userInfo.roles.map((role) => localize(userRoleDescriptors[role].title).toLocaleLowerCase()).join(', ')}
        </span>

        <Show when={authored()}>
          <span class={styles.published}>
            <GoldIcon />
            {authored()}
          </span>
        </Show>
      </section>

      <UserTooltip forRef={ref()} user={props.userInfo} />
    </Frame>
  );
};

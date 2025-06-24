import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { createResource, createSignal } from 'solid-js';
import type { Comment as CommentType } from '../../../core/entities/comment.js';
import { services } from '../../../core/services/index.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { userRoute } from '../../routes/user-route.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import { UserTooltip } from '../UserTooltip/UserTooltip.jsx';
import styles from './Comment.module.css';

export interface CommentProps {
  comment: CommentType;
  class?: string;
  service?: string;
  hideAuthorName?: boolean;
  hideDate?: boolean;
  hideTime?: boolean;
}

export const Comment: Component<CommentProps> = (props) => {
  const [userInfo] = createResource(
    () => props.comment.author,
    (user) => dataManager.getUserInfo(user),
  );

  const [titleRef, setTitleRef] = createSignal<HTMLLinkElement>();
  const [avatarRef, setAvatarRef] = createSignal<HTMLElement>();

  const title = () =>
    [
      !props.hideDate && formatDate(props.comment.datetime),
      !props.hideTime && formatTime(props.comment.datetime, true),
      !props.hideAuthorName && (userInfo()?.title || props.comment.author),
      props.service && (services.find((s) => s.id === props.service)?.name || props.service),
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <section class={clsx(props.class, styles.comment)}>
      <a class={styles.avatar} href={userRoute.createUrl({ id: props.comment.author })} ref={setAvatarRef}>
        <UserAvatar image={userInfo()?.avatar} title={userInfo()?.title ?? props.comment.author} size="small" />
      </a>

      <Show when={title()}>
        <a class={styles.title} href={userRoute.createUrl({ id: props.comment.author })} ref={setTitleRef}>
          {title()}
        </a>
      </Show>

      <p class={styles.text}>{props.comment.text}</p>

      <UserTooltip forRef={avatarRef()} user={userInfo()} showAvatar />

      <UserTooltip forRef={titleRef()} user={userInfo()} showAvatar />
    </section>
  );
};

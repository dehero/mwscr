import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { createResource, createSignal } from 'solid-js';
import type { PublicationComment } from '../../../core/entities/publication.js';
import { services } from '../../../core/services/index.js';
import { formatTime } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { userRoute } from '../../routes/user-route.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import { UserTooltip } from '../UserTooltip/UserTooltip.jsx';
import styles from './PostComment.module.css';

export interface PostCommentProps {
  comment: PublicationComment;
  class?: string;
  service?: string;
}

export const PostComment: Component<PostCommentProps> = (props) => {
  const [userInfo] = createResource(
    () => props.comment.author,
    (user) => dataManager.getUserInfo(user),
  );

  const [titleRef, setTitleRef] = createSignal<HTMLLinkElement>();
  const [avatarRef, setAvatarRef] = createSignal<HTMLElement>();

  return (
    <section class={clsx(props.class, styles.comment)}>
      <a class={styles.avatar} href={userRoute.createUrl({ id: props.comment.author })} ref={setAvatarRef}>
        <UserAvatar user={props.comment.author} />
      </a>

      <a class={styles.title} href={userRoute.createUrl({ id: props.comment.author })} ref={setTitleRef}>
        {formatTime(props.comment.datetime, true)}, {userInfo()?.title || props.comment.author}
        <Show when={props.service}>, {services.find((s) => s.id === props.service)?.name || props.service}</Show>
      </a>
      <p class={styles.text}>{props.comment.text}</p>

      <UserTooltip forRef={avatarRef()} user={userInfo()} showAvatar />

      <UserTooltip forRef={titleRef()} user={userInfo()} showAvatar />
    </section>
  );
};

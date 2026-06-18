import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { createSignal } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.js';
import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { postRoute } from '../../routes/post-route.js';

import { CommentPreview } from '../CommentPreview/CommentPreview.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.jsx';
import styles from './CommentPreviews.module.css';

export interface CommentPreviewsProps {
  commentInfos: CommentInfo[];
  class?: string;
  hideAuthorName?: boolean;
}

interface GroupProps {
  commentInfos: CommentInfo[];
  hideAuthorName?: boolean;
}

const Group: Component<GroupProps> = (props) => {
  const commentInfo = () => props.commentInfos[0];

  const url = () => {
    const path = commentInfo()?.path;
    if (!path) {
      return undefined;
    }

    const { managerName, id } = parsePostPath(path);
    return managerName && id ? postRoute.createUrl({ managerName, id }) : undefined;
  };

  const [previewRef, setPreviewRef] = createSignal<HTMLAnchorElement | undefined>(undefined);
  const [titleRef, setTitleRef] = createSignal<HTMLAnchorElement | undefined>(undefined);

  return (
    <section class={styles.group}>
      <Show when={commentInfo()}>
        {(commentInfo) => (
          <>
            <a class={styles.preview} href={url()} ref={setPreviewRef}>
              <PostContentPreview
                content={commentInfo().content}
                aspectRatio={commentInfo().aspect}
                maxHeightMultiplier={1}
              />
            </a>
            <a class={styles.title} href={url()} ref={setTitleRef}>
              {commentInfo().title}
            </a>
            <Divider class={styles.divider} />

            <PostTooltip forRef={previewRef()} postInfo={props.commentInfos[0]!.path} showContent />

            <PostTooltip forRef={titleRef()} postInfo={props.commentInfos[0]!.path} showContent />
          </>
        )}
      </Show>
      <section class={styles.comments}>
        <For each={props.commentInfos}>
          {(info) => <CommentPreview commentInfo={info} hideAuthorName={props.hideAuthorName} />}
        </For>
      </section>
    </section>
  );
};

export const CommentPreviews: Component<CommentPreviewsProps> = (props) => {
  const groups = () => [
    ...groupBy<string, CommentInfo>(props.commentInfos, (info, map) => {
      const [prevKey, prevGroup] = [...map.entries()].pop() ?? ['', []];
      const prevInfo = prevGroup[0];

      if (prevInfo?.path !== info.path) {
        return `${info.path}/${dateToString(info.datetime, true)}`;
      }

      return prevKey;
    }).entries(),
  ];

  return (
    <Frame class={clsx(styles.container, props.class)}>
      <For each={groups()} fallback={<p class={styles.fallbackText}>No comments yet</p>}>
        {(group) => <Group commentInfos={group[1]} hideAuthorName={props.hideAuthorName} />}
      </For>
    </Frame>
  );
};

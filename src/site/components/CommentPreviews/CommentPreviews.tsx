import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { createResource, createSignal } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.js';
import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
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
  const [postInfo] = createResource(
    () => props.commentInfos[0]?.path,
    (path) => {
      const { managerName, id } = parsePostPath(path);
      if (!managerName || !id) {
        return undefined;
      }

      return dataManager.getPostInfo(managerName, id);
    },
  );

  const url = () =>
    postInfo() ? postRoute.createUrl({ managerName: postInfo()!.managerName, id: postInfo()!.id }) : undefined;

  const [previewRef, setPreviewRef] = createSignal<HTMLAnchorElement | undefined>(undefined);
  const [titleRef, setTitleRef] = createSignal<HTMLAnchorElement | undefined>(undefined);

  return (
    <section class={styles.group}>
      <Show when={postInfo()}>
        {(postInfo) => (
          <>
            <a class={styles.preview} href={url()} ref={setPreviewRef}>
              <PostContentPreview
                content={postInfo().content}
                aspectRatio={postInfo().aspect}
                maxHeightMultiplier={1}
              />
            </a>
            <a class={styles.title} href={url()} ref={setTitleRef}>
              {postInfo().title}
            </a>
            <Divider class={styles.divider} />

            <PostTooltip forRef={previewRef()} postInfo={postInfo()} showContent />

            <PostTooltip forRef={titleRef()} postInfo={postInfo()} showContent />
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

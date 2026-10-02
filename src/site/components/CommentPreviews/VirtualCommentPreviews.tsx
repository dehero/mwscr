import { createVirtualizer } from '@tanstack/solid-virtual';
import clsx from 'clsx';
import { type Component, createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { groupBy } from '../../../core/utils/common-utils.ts';
import { dateToString } from '../../../core/utils/date-utils.ts';
import { postRoute } from '../../routes/post-route.ts';
import { texts } from '../../texts/index.ts';
import { localField, localize } from '../../utils/intl-utils.ts';
import { CommentPreview } from '../CommentPreview/CommentPreview.tsx';
import { Divider } from '../Divider/Divider.tsx';
import { Frame } from '../Frame/Frame.tsx';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.tsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.tsx';
import type { CommentPreviewsProps } from './CommentPreviews.tsx';
import styles from './CommentPreviews.module.css';

const GROUP_GAP = 16;
const DEFAULT_GROUP_HEIGHT = 120;
const OVERSCAN = 2;

const Group: Component<{ commentInfos: () => CommentInfo[]; hideAuthorName?: boolean }> = (props) => {
  const commentInfo = () => props.commentInfos()[0];

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
              {localField(commentInfo(), 'title')}
            </a>
            <Divider class={styles.divider} />

            <PostTooltip forRef={previewRef()} postInfo={props.commentInfos()[0]!.path} showContent />

            <PostTooltip forRef={titleRef()} postInfo={props.commentInfos()[0]!.path} showContent />
          </>
        )}
      </Show>
      <section class={styles.comments}>
        <For each={props.commentInfos()}>
          {(info) => <CommentPreview commentInfo={info} hideAuthorName={props.hideAuthorName} />}
        </For>
      </section>
    </section>
  );
};

export const VirtualCommentPreviews: Component<CommentPreviewsProps> = (props) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [scrollMargin, setScrollMargin] = createSignal(0);

  const groups = createMemo(() => [
    ...groupBy<string, CommentInfo>(props.commentInfos, (info, map) => {
      const [prevKey, prevGroup] = [...map.entries()].pop() ?? ['', []];
      const prevInfo = prevGroup[0];

      if (prevInfo?.path !== info.path) {
        return `${info.path}/${dateToString(info.datetime, true)}`;
      }

      return prevKey;
    }).entries(),
  ]);

  const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
    get count() {
      return groups().length;
    },
    getScrollElement: () => props.scrollTarget ?? container() ?? null,
    estimateSize: () => DEFAULT_GROUP_HEIGHT,
    overscan: OVERSCAN,
    gap: GROUP_GAP,
    getItemKey: (index) => groups()[index]?.[0] ?? index,
    get scrollMargin() {
      return scrollMargin();
    },
  });

  createEffect(() => {
    const target = props.scrollTarget ?? container();
    const body = container();

    if (!target || !body) {
      return;
    }

    const update = () => {
      setScrollMargin(
        body === target ? 0 : body.getBoundingClientRect().top - target.getBoundingClientRect().top + target.scrollTop,
      );
    };

    const observer = new ResizeObserver(update);

    observer.observe(target);
    observer.observe(body);
    update();

    onCleanup(() => observer.disconnect());
  });

  return (
    <Frame class={clsx(styles.container, props.class)} ref={setContainer}>
      <Show
        when={groups().length > 0}
        fallback={<p class={styles.fallbackText}>{localize(texts.content.noCommentsYet)}</p>}
      >
        <div class={styles.virtualBody} style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(virtualItem) => (
              <div
                ref={(element: HTMLDivElement) => {
                  element.setAttribute('data-index', String(virtualItem.index));
                  queueMicrotask(() => virtualizer.measureElement(element));
                }}
                class={styles.virtualItem}
                style={{ transform: `translateY(${virtualItem.start - scrollMargin()}px)` }}
              >
                <Group
                  commentInfos={() => groups()[virtualItem.index]?.[1] ?? []}
                  hideAuthorName={props.hideAuthorName}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </Frame>
  );
};

export default VirtualCommentPreviews;

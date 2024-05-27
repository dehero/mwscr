import clsx from 'clsx';
import { type Component, createSignal, For, Show } from 'solid-js';
import { getPostTypeAspectRatio, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { UserEntry } from '../../../core/entities/user.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { postRoute } from '../../routes/post-route.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './PostPreview.module.css';

export const POST_PREVIEW_MAX_WIDTH = 324;
export const POST_PREVIEW_INFO_MIN_HEIGHT = 30;
export const POST_PREVIEW_GAP = 3;

export interface PostPreviewProps {
  class?: string;
  postInfo: PostInfo;
  managerName: string;
}

function getUserLetter(userEntry: UserEntry) {
  return getUserEntryTitle(userEntry)[0]?.toLocaleUpperCase() || '?';
}

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const title = () => props.postInfo.title || props.postInfo.id;
  const content = () => asArray(props.postInfo.content).slice(0, 4);
  const authorLetters = () => props.postInfo.authorEntries.map(getUserLetter);
  const requesterLetter = () =>
    props.postInfo.requesterEntry ? getUserLetter(props.postInfo.requesterEntry) : undefined;
  const url = () => postRoute.createUrl({ managerName: props.managerName, id: props.postInfo.id });
  const aspectRatio = () => getPostTypeAspectRatio(props.postInfo.type);

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <a class={clsx(styles.container, props.class)} ref={setRef} href={url()}>
      <Show
        when={content().length > 0}
        fallback={
          <Frame variant="thin" class={styles.fallback}>
            <p>{props.postInfo.request?.text}</p>
          </Frame>
        }
      >
        <Show
          when={content().length > 2}
          fallback={<ResourcePreview url={content()[0] || ''} aspectRatio={aspectRatio()} class={styles.image} />}
        >
          <div class={clsx(styles[props.postInfo.type], styles.setContainer)}>
            <For each={content()}>
              {(url) => <ResourcePreview url={url} class={styles.setItem} aspectRatio={aspectRatio()} />}
            </For>
          </div>
        </Show>
      </Show>
      <Show when={title() || props.postInfo.rating}>
        <Frame variant="thin" class={styles.info}>
          <div class={styles.header}>
            <div class={styles.title}>{title()}</div>
            <span class={styles.attributes}>
              <Show when={props.postInfo.published}>
                <GoldIcon />
              </Show>

              <Show when={props.postInfo.rating}>
                <span class={styles.rating}>{props.postInfo.rating}</span>
              </Show>

              <Show when={props.postInfo.mark || props.postInfo.violation || authorLetters().length > 0}>
                <Frame class={styles.icons}>
                  <For each={authorLetters()}>
                    {(letter) => (
                      <Icon size="small" variant="flat" color="stealth">
                        {letter}
                      </Icon>
                    )}
                  </For>

                  <Show when={requesterLetter()}>
                    {(letter) => (
                      <Icon size="small" variant="flat" color="magic">
                        {letter()}
                      </Icon>
                    )}
                  </Show>

                  <Show when={props.postInfo.mark}>
                    <Icon color="combat" size="small" variant="flat">
                      {props.postInfo.mark?.[0]}
                    </Icon>
                  </Show>

                  <Show when={props.postInfo.violation}>
                    {(violation) => (
                      <Icon color="health" size="small" variant="flat">
                        {POST_VIOLATIONS[violation()].letter}
                      </Icon>
                    )}
                  </Show>
                </Frame>
              </Show>
            </span>
          </div>
          <Show when={props.postInfo.description}>
            <>
              <Divider />
              <div class={styles.description}>{props.postInfo.description}</div>
            </>
          </Show>
        </Frame>
      </Show>
      <PostTooltip forRef={ref()} postInfo={props.postInfo} />
    </a>
  );
};

import clsx from 'clsx';
import { type Component, createResource, createSignal, For, Show } from 'solid-js';
import type { Post, PostEntry } from '../../../core/entities/post.js';
import { getPostRating, POST_VIOLATIONS } from '../../../core/entities/post.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { users } from '../../data-managers/users.js';
import { postRoute } from '../../routes/post-route.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './PostPreview.module.css';

interface PostPreviewProps {
  class?: string;
  postEntry: PostEntry<Post>;
  managerName: string;
}

async function getUserLetters(ids: string[]) {
  const userEntries = await users.getEntries(ids);

  return userEntries.map((userEntry) => getUserEntryTitle(userEntry)[0]?.toLocaleUpperCase() || '?');
}

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const title = () => props.postEntry[1].title || props.postEntry[0];
  const rating = () => Number(getPostRating(props.postEntry[1]).toFixed(2));
  const content = () => asArray(props.postEntry[1].content).slice(0, 4);
  const [authorLetters] = createResource(() => asArray(props.postEntry[1].author), getUserLetters);
  const [requesterLetters] = createResource(() => asArray(props.postEntry[1].request?.user), getUserLetters);
  const url = () => postRoute.createUrl({ managerName: props.managerName, id: props.postEntry[0] });

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <a class={clsx(styles.container, props.class)} ref={setRef} href={url()}>
      <Show
        when={content().length > 0}
        fallback={
          <Frame variant="thin" class={styles.fallback}>
            <p>{props.postEntry[1].request?.text}</p>
          </Frame>
        }
      >
        <Show when={content().length > 2} fallback={<ResourcePreview url={content()[0] || ''} class={styles.image} />}>
          <div class={clsx(styles[props.postEntry[1].type], styles.setContainer)}>
            <For each={content()}>{(url) => <ResourcePreview url={url} class={styles.setItem} />}</For>
          </div>
        </Show>
      </Show>
      <Show when={title() || rating()}>
        <Frame variant="thin" class={styles.info}>
          <div class={styles.header}>
            <div class={styles.title}>{title()}</div>
            <span class={styles.attributes}>
              <Show when={props.postEntry[1].posts}>
                <GoldIcon />
              </Show>

              <Show when={rating()}>
                <span class={styles.rating}>{rating()}</span>
              </Show>

              <Show when={props.postEntry[1].mark || props.postEntry[1].violation || Boolean(authorLetters()?.length)}>
                <Frame class={styles.icons}>
                  <For each={authorLetters()}>
                    {(letter) => (
                      <Icon size="small" variant="flat" color="stealth">
                        {letter}
                      </Icon>
                    )}
                  </For>

                  <For each={requesterLetters()}>
                    {(letter) => (
                      <Icon size="small" variant="flat" color="magic">
                        {letter}
                      </Icon>
                    )}
                  </For>

                  <Show when={props.postEntry[1].mark}>
                    <Icon color="combat" size="small" variant="flat">
                      {props.postEntry[1].mark?.[0]}
                    </Icon>
                  </Show>

                  <Show when={props.postEntry[1].violation}>
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
          <Show when={props.postEntry[1].description}>
            <>
              <Divider />
              <div class={styles.description}>{props.postEntry[1].description}</div>
            </>
          </Show>
        </Frame>
      </Show>
      <PostTooltip forRef={ref()} postEntry={props.postEntry} />
    </a>
  );
};

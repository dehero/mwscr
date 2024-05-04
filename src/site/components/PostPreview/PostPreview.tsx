import clsx from 'clsx';
import { type Component, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { Post, PostEntry } from '../../../core/entities/post.js';
import { getPostRating } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './PostPreview.module.css';

interface PostPreviewProps {
  class?: string;
  postEntry: PostEntry<Post>;
  url?: string;
}

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const title = () => props.postEntry[1].title || props.postEntry[0];
  const rating = () => Number(getPostRating(props.postEntry[1]).toFixed(2));
  const content = () => asArray(props.postEntry[1].content).slice(0, 4);

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <Dynamic
      component={props.url ? 'a' : 'div'}
      class={clsx(styles.container, props.class)}
      ref={setRef}
      href={props.url}
    >
      <Show
        when={content().length > 0}
        fallback={
          <Frame variant="thin" class={styles.fallback}>
            <p>{props.postEntry[1].request?.text}</p>
          </Frame>
        }
      >
        <Show when={content().length > 2} fallback={<ResourcePreview url={content()[0] || ''} />}>
          <div class={clsx(styles[props.postEntry[1].type], styles.setContainer)}>
            <For each={content()}>{(url) => <ResourcePreview url={url} class={styles.setItem} />}</For>
          </div>
        </Show>
      </Show>
      <Show when={title() || rating()}>
        <Frame variant="thin" class={styles.info}>
          <div class={styles.header}>
            <Show when={title()}>
              <div class={styles.title}>{title()}</div>
            </Show>
            <Show when={rating()}>
              <span class={styles.rating}>{rating()}</span>
            </Show>
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
    </Dynamic>
  );
};

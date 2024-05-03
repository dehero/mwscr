import clsx from 'clsx';
import { type Component, createSignal, For, Show } from 'solid-js';
import { getPostRating, type Post } from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Frame } from '../Frame/Frame.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './PostPreview.module.css';

function getPreviewUrl(url: string | undefined) {
  return url?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif');
}

interface PostPreviewProps {
  class?: string;
  post: Post;
  url?: string;
}

const ImagePreview: Component<{ url: string | undefined }> = (props) => {
  return <img src={getPreviewUrl(props.url)} class={styles.image} />;
};

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const urls = () => asArray(props.post.content);
  const rating = () => getPostRating(props.post);

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <Frame
      variant="thick"
      component={props.url ? 'a' : 'div'}
      class={clsx(styles.postPreview, props.class)}
      ref={setRef}
      href={props.url}
    >
      <Show when={urls().length > 1} fallback={<ImagePreview url={urls().at(0)} />}>
        <div class={clsx(styles[props.post.type], styles.setContainer)}>
          <For each={urls()}>{(previewUrl) => <ResourcePreview url={previewUrl} class={styles.setItem} />}</For>
        </div>
      </Show>
      <div class={styles.infoWrapper}>
        <Frame variant="thin" class={styles.info}>
          <div class={styles.title}>{props.post.title}</div>
          <Show when={rating()}>
            <span class={styles.rating}>{rating().toFixed(2)}</span>
          </Show>
        </Frame>
      </div>
      <PostTooltip forRef={ref()} post={props.post} />
    </Frame>
  );
};

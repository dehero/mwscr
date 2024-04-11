import clsx from 'clsx';
import { type Component, createResource, createSignal, For, Show } from 'solid-js';
import { getPostRating, type Post } from '../../entities/post.js';
import { asArray } from '../../utils/common-utils.js';
import { Frame } from '../Frame/Frame.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import styles from './PostPreview.module.css';

const getPreviewUrl = async (url: string | undefined) => {
  if (import.meta.env.DEV) {
    if (!url) {
      return;
    }
    const previews = import.meta.glob('../../../assets/previews/**/*.avif', { query: 'url', import: 'default' });
    const importPath = url.replace(/^store:\/(.*)\..*/, '../../../assets/previews/$1.avif');
    const previewUrl = (await previews[importPath]?.()) as string | undefined;
    return previewUrl ?? url;
  }

  return url?.replace(/^store:\/(.*)\..*/, 'https://github.com/dehero/mwscr/raw/main/assets/previews/$1.avif');
};

interface PostPreviewProps {
  class?: string;
  post: Post;
}

const ImagePreview: Component<{ url: string | undefined }> = (props) => {
  const [src] = createResource(() => props.url, getPreviewUrl);

  return (
    <Show when={!src.loading} fallback={<div class={styles.image} />}>
      <img src={src()} class={styles.image} />
    </Show>
  );
};

export const PostPreview: Component<PostPreviewProps> = (props) => {
  const urls = () => asArray(props.post.content);
  const rating = () => getPostRating(props.post);

  const [ref, setRef] = createSignal<HTMLElement>();

  return (
    <Frame variant="thick" class={clsx(styles.postPreview, props.class)} ref={setRef}>
      <Show when={urls().length > 1} fallback={<ImagePreview url={urls().at(0)} />}>
        <div class={clsx(styles[props.post.type], styles.setContainer)}>
          <For each={urls()}>
            {(previewUrl) => (
              <Frame variant="thin" class={styles.setItem}>
                <ImagePreview url={previewUrl} />
              </Frame>
            )}
          </For>
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

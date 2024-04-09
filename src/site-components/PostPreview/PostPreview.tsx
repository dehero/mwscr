import clsx from 'clsx';
import { type Component, createResource, For, Show } from 'solid-js';
import { getPostRating, type Post } from '../../entities/post.js';
import { asArray } from '../../utils/common-utils.js';
import { Frame } from '../Frame/Frame.jsx';
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

export const PostPreview: Component<PostPreviewProps> = ({ post, ...props }) => {
  const previewUrls = asArray(post.content).map((url) => createResource(url, getPreviewUrl)[0]);

  return (
    <div class={styles.postPreviewWrapper}>
      <Frame variant="thick" class={clsx(styles.postPreview, props.class)}>
        <Show when={previewUrls.length === 1}>
          <img src={previewUrls[0]?.()} class={styles.image} />
        </Show>
        <Show when={previewUrls.length > 1}>
          <div class={clsx(styles[post.type], styles.images)}>
            <For each={previewUrls}>
              {(previewUrl) => (
                <Frame variant="thin">
                  <img src={previewUrl()} class={styles.image} />
                </Frame>
              )}
            </For>
          </div>
        </Show>
        <div class={styles.infoWrapper}>
          <Frame variant="thin" class={styles.info}>
            {post.title}
            <span class={styles.rating}>{getPostRating(post).toFixed(2)}</span>
          </Frame>
        </div>
      </Frame>
    </div>
  );
};

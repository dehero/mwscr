import clsx from 'clsx';
import type { Component } from 'solid-js';
import type { Post } from '../../../entities/post.js';
import { asArray } from '../../../utils/common-utils.js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './PostPreview.module.css';

interface PostPreviewProps {
  class?: string;
  post: Post;
}

export const PostPreview: Component<PostPreviewProps> = ({ post, ...props }) => {
  const src = asArray(post.content)[0]?.replace(
    /^store:\/(.*)\..*/,
    'https://github.com/dehero/mwscr/raw/main/assets/previews/$1.avif',
  );

  return (
    <div class={styles.postPreviewWrapper}>
      <Frame variant="thick" class={clsx(styles.postPreview, props.class)}>
        <img src={src} />
        <div class={styles.infoWrapper}>
          <Frame variant="thin" class={styles.info}>
            {post.title}
          </Frame>
        </div>
      </Frame>
    </div>
  );
};

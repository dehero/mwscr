import clsx from 'clsx';
import { type Component, For } from 'solid-js';
import type { Post } from '../../../core/entities/post.js';
import {
  getPostCommentCount,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
  getServicePostRating,
} from '../../../core/entities/post.js';
import { services } from '../../../core/services/index.js';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Table } from '../Table/Table.jsx';
import styles from './PostPublications.module.css';

export interface PostPublicationsProps {
  class?: string;
  post: Post;
}

export const PostPublications: Component<PostPublicationsProps> = (props) => {
  return (
    <Frame variant="thin" class={clsx(styles.container, props.class)}>
      <Table
        class={styles.table}
        rows={[
          {
            label: 'Likes',
            value: getPostTotalLikes(props.post),
          },
          {
            label: 'Views',
            value: getPostTotalViews(props.post),
          },
          {
            label: 'Rating',
            value: Number(getPostRating(props.post).toFixed(2)),
          },
          {
            label: 'Comments',
            value: getPostCommentCount(props.post),
          },
        ]}
      />

      <For each={props.post.posts}>
        {(servicePost) => {
          const service = services.find((s) => s.id === servicePost.service);

          return (
            <>
              <Divider />
              <Table
                class={styles.table}
                label={service?.name}
                value={servicePost.published.toLocaleDateString('en-GB')}
                rows={[
                  {
                    label: 'Likes',
                    value: servicePost.likes,
                  },
                  {
                    label: 'Views',
                    value: servicePost.views,
                  },
                  {
                    label: 'Reposts',
                    value: servicePost.reposts,
                  },
                  {
                    label: 'Followers',
                    value: servicePost.followers,
                  },
                  {
                    label: 'Rating',
                    value: Number(getServicePostRating(servicePost).toFixed(2)),
                  },
                  {
                    label: 'Comments',
                    value: servicePost.comments?.length,
                  },
                ]}
              />
            </>
          );
        }}
      </For>
    </Frame>
  );
};

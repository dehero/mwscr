import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { Post } from '../../../core/entities/post.js';
import { getServicePostRating } from '../../../core/entities/post.js';
import { postingServices } from '../../../core/services/index.js';
import { formatDate } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Table } from '../Table/Table.js';
import styles from './PostPublications.module.css';

export interface PostPublicationsProps {
  class?: string;
  post: Post;
}

export const PostPublications: Component<PostPublicationsProps> = (props) => {
  return (
    <Frame variant="thin" class={clsx(styles.container, props.class)}>
      <For
        each={[...(props.post.posts ?? [])].sort((a, b) => b.published.getTime() - a.published.getTime())}
        fallback={<span class={styles.fallback}>No publications yet</span>}
      >
        {(servicePost, index) => {
          const service = postingServices.find((s) => s.id === servicePost.service);

          return (
            <>
              <Show when={index() > 0}>
                <Divider />
              </Show>
              <Table
                class={styles.table}
                label={service?.name}
                value={formatDate(servicePost.published)}
                link={service?.getServicePostUrl(servicePost)}
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

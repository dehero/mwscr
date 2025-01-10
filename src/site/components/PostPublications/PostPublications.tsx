import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { getPublicationEngagement, type Publication } from '../../../core/entities/publication.js';
import { postingServices } from '../../../core/services/index.js';
import { formatDate } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Table } from '../Table/Table.js';
import styles from './PostPublications.module.css';

export interface PostPublicationsProps {
  class?: string;
  publications: Publication[];
}

export const PostPublications: Component<PostPublicationsProps> = (props) => {
  return (
    <Frame variant="thin" class={clsx(styles.container, props.class)}>
      <For
        each={[...props.publications].sort((a, b) => b.published.getTime() - a.published.getTime())}
        fallback={<span class={styles.fallback}>No publications yet</span>}
      >
        {(publication, index) => {
          const service = postingServices.find((s) => s.id === publication.service);

          return (
            <>
              <Show when={index() > 0}>
                <Divider />
              </Show>
              <Table
                class={styles.table}
                label={service?.name}
                value={formatDate(publication.published)}
                link={service?.getPublicationUrl(publication)}
                rows={[
                  {
                    label: 'Likes',
                    value: publication.likes,
                  },
                  {
                    label: 'Views',
                    value: publication.views,
                  },
                  {
                    label: 'Reposts',
                    value: publication.reposts,
                  },
                  {
                    label: 'Followers',
                    value: publication.followers,
                  },
                  {
                    label: 'Engagement',
                    value: Number(getPublicationEngagement(publication).toFixed(2)),
                  },
                  {
                    label: 'Comments',
                    value: publication.comments?.length,
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

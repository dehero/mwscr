import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import { type Option } from '../../../core/entities/option.js';
import { getPostDateById } from '../../../core/entities/post.js';
import {
  getPublicationEngagement,
  getPublicationsStats,
  getRecentPublications,
  type Publication,
} from '../../../core/entities/publication.js';
import { postingServices } from '../../../core/services/index.js';
import { formatDate } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Select } from '../Select/Select.jsx';
import { Table } from '../Table/Table.js';
import styles from './PostPublications.module.css';

export interface PostPublicationsProps {
  class?: string;
  postIds: string[];
  selectedPostId: string;
  onSelectPostId: (id: string | undefined) => void;
  publications: Publication[];
}

export const PostPublications: Component<PostPublicationsProps> = (props) => {
  const date = () => getPostDateById(props.selectedPostId);
  const publications = () => [...(date() ? getRecentPublications(props.publications, date()!) : props.publications)];
  const stats = () => getPublicationsStats(publications());

  const options = (): Option[] =>
    [...props.postIds]
      .sort((a, b) => b.localeCompare(a))
      .map((id) => {
        const date = getPostDateById(id);
        return {
          value: id,
          label: date ? formatDate(date) : id,
        };
      });

  return (
    <Frame variant="thin" class={clsx(styles.container, props.class)}>
      <Select options={options()} value={props.selectedPostId} onChange={props.onSelectPostId} />

      <Table
        class={styles.table}
        rows={[
          {
            label: 'Likes',
            value: stats().likes,
          },
          {
            label: 'Views',
            value: stats().views,
          },
          {
            label: 'Followers',
            value: stats().followers,
          },
          {
            label: 'Engagement',
            value: Number(stats().engagement.toFixed(2)),
          },
          {
            label: 'Comments',
            value: stats().commentCount,
          },
        ]}
      />

      <Divider />

      <For
        each={publications().sort((a, b) => b.published.getTime() - a.published.getTime())}
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

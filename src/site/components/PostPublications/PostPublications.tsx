import clsx from 'clsx';
import { type Component, createResource, For, Show } from 'solid-js';
import { type Option } from '../../../core/entities/option.ts';
import { getPostDateById } from '../../../core/entities/post.ts';
import type { PostsManagerName } from '../../../core/entities/posts-manager.ts';
import {
  getPublicationEngagement,
  getRecentPublications,
  type Publication,
} from '../../../core/entities/publication.ts';
import { postingServices } from '../../../core/services/index.ts';
import { formatDate } from '../../../core/utils/date-utils.ts';
import { dataManager } from '../../data-managers/manager.ts';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { texts } from '../../texts/index.ts';
import { currentLocale, localize } from '../../utils/intl-utils.ts';
import { Divider } from '../Divider/Divider.tsx';
import { Frame } from '../Frame/Frame.tsx';
import { Select } from '../Select/Select.tsx';
import { Table } from '../Table/Table.tsx';
import styles from './PostPublications.module.css';

export interface PostPublicationsProps {
  class?: string;
  managerName: PostsManagerName;
  postIds: string[];
  selectedPostId: string;
  onSelectPostId: (id: string | undefined) => void;
  publications: Publication[];
}

export const PostPublications: Component<PostPublicationsProps> = (props) => {
  const date = () => getPostDateById(props.selectedPostId);

  const [postInfo, { refetch }] = createResource(
    (): [PostsManagerName, string] => [props.managerName, props.selectedPostId],
    ([managerName, id]) => dataManager.getPostInfo(managerName, id),
  );

  useLocalPatch(() => {
    refetch();
  });

  const publications = () => [...(date() ? getRecentPublications(props.publications, date()!) : props.publications)];

  const options = (): Option[] =>
    [...props.postIds]
      .sort((a, b) => b.localeCompare(a))
      .map((id) => {
        const date = getPostDateById(id);
        return {
          value: id,
          label: date ? formatDate(date, currentLocale()) : id,
        };
      });

  return (
    <Frame variant="thin" class={clsx(styles.container, props.class)}>
      <Select options={options()} value={props.selectedPostId} onChange={props.onSelectPostId} />

      <Table
        class={styles.table}
        rows={[
          {
            label: localize(texts.metrics.likes),
            value: postInfo()?.likes,
          },
          {
            label: localize(texts.metrics.views),
            value: postInfo()?.views,
          },
          {
            label: localize(texts.metrics.engagement),
            value: Number(postInfo()?.engagement.toFixed(2)),
          },
          {
            label: localize(texts.metrics.comments),
            value: postInfo()?.commentCount,
          },
          {
            label: localize(texts.metrics.followersAtPublication),
            value: postInfo()?.followers,
          },
        ]}
      />

      <Divider />

      <For
        each={publications().sort((a, b) => b.published.getTime() - a.published.getTime())}
        fallback={<span class={styles.fallback}>{localize(texts.content.noPublicationsYet)}</span>}
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
                value={formatDate(publication.published, currentLocale())}
                link={service?.getPublicationUrl(publication)}
                rows={[
                  {
                    label: localize(texts.metrics.likes),
                    value: publication.likes,
                  },
                  {
                    label: localize(texts.metrics.views),
                    value: publication.views,
                  },
                  {
                    label: localize(texts.metrics.repostsCount),
                    value: publication.reposts,
                  },
                  {
                    label: localize(texts.metrics.engagement),
                    value: Number(getPublicationEngagement(publication).toFixed(2)),
                  },
                  {
                    label: localize(texts.metrics.comments),
                    value: publication.comments?.length,
                  },
                  {
                    label: localize(texts.metrics.followersAtPublication),
                    value: publication.followers,
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

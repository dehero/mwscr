import { createAsync } from '@solidjs/router';
import { For, Show } from 'solid-js';
import type { PostsUsage } from '../../../core/entities/posts-usage.ts';
import { getPostDateById, postViolationDescriptors } from '../../../core/entities/post.ts';
import { postsManagerDescriptors } from '../../../core/entities/posts-manager.ts';
import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.ts';
import { dateToString } from '../../../core/utils/date-utils.ts';
import { AppPage } from '../../components/App/App.tsx';
import { Button } from '../../components/Button/Button.tsx';
import { CommentPreviews } from '../../components/CommentPreviews/CommentPreviews.tsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Diagram } from '../../components/Diagram/Diagram.tsx';
import { Divider } from '../../components/Divider/Divider.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import { PostTooltip } from '../../components/PostTooltip/PostTooltip.tsx';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar.tsx';
import { Table } from '../../components/Table/Table.tsx';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { postRoute } from '../../routes/post-route.ts';
import { postsRoute } from '../../routes/posts-route.ts';
import { userRoute } from '../../routes/user-route.ts';
import { usersRoute } from '../../routes/users-route.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import type { StatsPageData } from './StatsPage.data.ts';
import { queryStatsPageData } from './StatsPage.data.ts';
import styles from './StatsPage.module.css';

function sumUsage(usage: PostsUsage | undefined): number {
  return Object.values(usage ?? {}).reduce((acc, value) => acc + (value ?? 0), 0);
}

export const StatsPage: SiteRoutePage<SiteRouteParams, StatsPageData> = () => {
  const data = createAsync(() => queryStatsPageData());
  const [patchSize, patchName] = useLocalPatch();

  return (
    <>
      <AppPage title={localize(texts.stats.stats)} description={localize(texts.stats.description)} loading={!data()} />

      <Show when={data()}>
        {(data) => (
          <Frame component="main" class={styles.container}>
            <Frame class={styles.panel}>
              <Table
                showEmptyValueRows
                rows={[
                  {
                    label: localize(texts.stats.localEdits),
                    value: patchSize(),
                    link: createDetachedDialogFragment('contributing'),
                  },
                  {
                    label: localize(texts.stats.patchName),
                    value: patchName(),
                  },
                ]}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.overview)}</div>
              <Table
                showEmptyValueRows
                rows={[
                  {
                    label: localize(postsManagerDescriptors.posts.title),
                    value: data().totalPosts.posts,
                    link: postsRoute.createUrl({ managerName: 'posts' }),
                  },
                  {
                    label: localize(postsManagerDescriptors.extras.title),
                    value: data().totalPosts.extras,
                    link: postsRoute.createUrl({ managerName: 'extras' }),
                  },
                  {
                    label: localize(postsManagerDescriptors.drafts.title),
                    value: data().draftCount,
                    link: postsRoute.createUrl({ managerName: 'drafts' }),
                  },
                  {
                    label: localize(postsManagerDescriptors.rejects.title),
                    value: data().rejectCount,
                    link: postsRoute.createUrl({ managerName: 'rejects' }),
                  },
                  {
                    label: localize(texts.user.users),
                    value: data().membersCount,
                    link: usersRoute.createUrl({}),
                  },
                  {
                    label: localize(texts.stats.originalPosts),
                    value: data().originalCount,
                    link: postsRoute.createUrl({ managerName: 'posts', original: 'true' }),
                  },
                  {
                    label: localize(texts.stats.unlocatedPosts),
                    value: data().unlocatedCount,
                    link: postsRoute.createUrl({ managerName: 'posts', location: 'none', original: 'true' }),
                  },
                  {
                    label: localize(texts.stats.untaggedPosts),
                    value: data().untaggedCount,
                  },
                  {
                    label: localize(texts.metrics.likes),
                    value: data().totalLikes,
                  },
                  {
                    label: localize(texts.metrics.comments),
                    value: data().totalCommentCount,
                  },
                ]}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.queues)}</div>
              <Table
                showEmptyValueRows
                rows={[
                  {
                    label: localize(texts.stats.draftsInWork),
                    value: data().draftCount,
                    link: postsRoute.createUrl({ managerName: 'drafts' }),
                  },
                  {
                    label: localize(texts.stats.readyDrafts),
                    value: data().readyDraftCount,
                    link: postsRoute.createUrl({ managerName: 'drafts', publishable: 'true' }),
                  },
                  {
                    label: localize(texts.stats.unreadyDrafts),
                    value: data().unreadyDraftCount,
                    link: postsRoute.createUrl({ managerName: 'drafts', publishable: 'false' }),
                  },
                  {
                    label: localize(texts.stats.requestedDrafts),
                    value: data().requestCount,
                    link: postsRoute.createUrl({ managerName: 'drafts', requester: 'any' }),
                  },
                  {
                    label: localize(texts.stats.recentlyChanged),
                    value: data().localEditCounts.changed,
                    link: postsRoute.createUrl({ managerName: 'posts', status: 'changed' }),
                  },
                  {
                    label: localize(texts.stats.recentlyAdded),
                    value: data().localEditCounts.added,
                    link: postsRoute.createUrl({ managerName: 'posts', status: 'added' }),
                  },
                  {
                    label: localize(texts.stats.recentlyRemoved),
                    value: data().localEditCounts.removed,
                    link: postsRoute.createUrl({ managerName: 'posts', status: 'removed' }),
                  },
                  {
                    label: localize(texts.stats.violations),
                    value: data().rejectCount,
                    link: postsRoute.createUrl({ managerName: 'rejects', violation: 'any' }),
                  },
                  {
                    label: localize(texts.stats.unlocated),
                    value: data().unlocatedCount,
                    link: postsRoute.createUrl({ managerName: 'posts', location: 'none', original: 'true' }),
                  },
                ]}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.coverage)}</div>
              <Table
                showEmptyValueRows
                rows={[
                  {
                    label: localize(texts.stats.totalLocations),
                    value: data().totalLocationsCount,
                  },
                  {
                    label: localize(texts.stats.discoveredLocations),
                    value: data().discoveredLocationsCount,
                  },
                  {
                    label: localize(texts.stats.undiscoveredLocations),
                    value: data().undiscoveredLocationsCount,
                  },
                ]}
              />
              <ProgressBar value={data().discoveredLocationsCount} maximum={data().totalLocationsCount || 1} />
              <Divider />
              <Table
                label={localize(texts.stats.topTags)}
                rows={data().tagItems.map((item) => ({
                  label: item.id,
                  value: item.count,
                  link: postsRoute.createUrl({ managerName: 'posts', tag: item.id }),
                }))}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.violations)}</div>
              <Table
                showEmptyValueRows
                rows={data().violationItems.map((item) => ({
                  label: localize(postViolationDescriptors[item.violation].title),
                  value: item.count,
                  link: postsRoute.createUrl({ managerName: 'rejects', violation: item.violation }),
                }))}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.undiscoveredLocations)}</div>
              <Table
                label={localize(texts.stats.undiscoveredLocations)}
                rows={data().undiscoveredLocationTitles.map((title) => ({ label: title }))}
                showEmptyValueRows
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.contributors)}</div>
              <Table
                label={localize(texts.stats.topAuthors)}
                rows={data().authorItems.map((info) => ({
                  label: info.title,
                  value: sumUsage(info.authored),
                  link: userRoute.createUrl({ id: info.id }),
                }))}
              />
              <Divider />
              <Table
                label={localize(texts.stats.topLocators)}
                rows={data().locatorItems.map((info) => ({
                  label: info.title,
                  value: sumUsage(info.located),
                  link: userRoute.createUrl({ id: info.id }),
                }))}
              />
              <Divider />
              <Table
                label={localize(texts.stats.topRequesters)}
                rows={data().requesterItems.map((info) => ({
                  label: info.title,
                  value: sumUsage(info.requested),
                  link: userRoute.createUrl({ id: info.id }),
                }))}
              />
              <Divider />
              <Table
                label={localize(texts.stats.topCommenters)}
                rows={data().commenterItems.map((info) => ({
                  label: info.title,
                  value: sumUsage(info.commented),
                  link: userRoute.createUrl({ id: info.id }),
                }))}
              />
              <Divider />
              <Table
                label={localize(texts.stats.novices)}
                rows={data().noviceItems.map((info) => ({
                  label: info.title,
                  value: sumUsage(info.authored) + sumUsage(info.requested),
                  link: userRoute.createUrl({ id: info.id }),
                }))}
              />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.activity)}</div>
              <div class={styles.diagrams}>
                <Diagram
                  class={styles.diagram}
                  label={localize(texts.metrics.followersCount)}
                  items={data().recentPostInfos.items}
                  getItemInterval={(item) => dateToString(getPostDateById(item.id) ?? new Date())}
                  getIntervalValue={(_, values) => values[0]?.followers || 0}
                  getIntervalLink={(_, values) =>
                    values[0] ? postRoute.createUrl({ managerName: 'posts', id: values[0]?.id }) : undefined
                  }
                  IntervalTooltipComponent={({ interval, forRef }) =>
                    interval.items[0] ? (
                      <PostTooltip postInfo={interval.items[0]} forRef={forRef} showContent />
                    ) : undefined
                  }
                  baseValue="delta"
                />

                <Divider class={styles.divider} />

                <Diagram
                  class={styles.diagram}
                  label={localize(texts.metrics.recentPostsEngagement)}
                  items={data().recentPostInfos.items}
                  getItemInterval={(item) => dateToString(getPostDateById(item.id) ?? new Date())}
                  getIntervalValue={(_, values) => values[0]?.engagement || 0}
                  getIntervalLink={(_, values) =>
                    values[0] ? postRoute.createUrl({ managerName: 'posts', id: values[0]?.id }) : undefined
                  }
                  IntervalTooltipComponent={({ interval, forRef }) =>
                    interval.items[0] ? (
                      <PostTooltip postInfo={interval.items[0]} forRef={forRef} showContent />
                    ) : undefined
                  }
                />
              </div>
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.recentComments)}</div>
              <CommentPreviews commentInfos={data().recentCommentInfos} />
            </Frame>

            <Frame class={styles.panel}>
              <div class={styles.panelTitle}>{localize(texts.stats.openProjects)}</div>
              <div class={styles.actions}>
                <For
                  each={[
                    texts.contributing.submitFiles,
                    texts.contributing.createCompilation,
                    texts.contributing.requestThemedPost,
                    texts.contributing.findMissingLocation,
                  ]}
                >
                  {(label) => <Button href={createDetachedDialogFragment('contributing')}>{localize(label)}</Button>}
                </For>
              </div>
            </Frame>
          </Frame>
        )}
      </Show>
    </>
  );
};

export default StatsPage;

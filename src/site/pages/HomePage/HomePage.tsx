import { createAsync, revalidate } from '@solidjs/router';
import clsx from 'clsx';
import { Show } from 'solid-js';
import icon from '../../../../assets/icon.png?format=avif&imagetools';
import { getPostDateById } from '../../../core/entities/post.js';
import { selectPostInfos } from '../../../core/entities/post-info.js';
import { postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.js';
import { max } from '../../../core/services/max.js';
import { dateToString, formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { capitalize } from '../../../core/utils/string-utils.js';
import { AppPage } from '../../components/App/App.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { CommentPreviews } from '../../components/CommentPreviews/CommentPreviews.jsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Diagram } from '../../components/Diagram/Diagram.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { GoldIcon } from '../../components/GoldIcon/GoldIcon.jsx';
import type { PostHighlightsItem } from '../../components/PostHighlights/PostHighlights.jsx';
import { PostHighlights } from '../../components/PostHighlights/PostHighlights.jsx';
import { PostTooltip } from '../../components/PostTooltip/PostTooltip.jsx';
import { Table } from '../../components/Table/Table.jsx';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postRoute } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { texts } from '../../texts/index.js';
import { currentLocale, isRu, localize } from '../../utils/intl-utils.js';
import type { HomePageData } from './HomePage.data.js';
import { queryHomePageData } from './HomePage.data.js';
import styles from './HomePage.module.css';

export const HomePage: SiteRoutePage<SiteRouteParams, HomePageData> = () => {
  const data = createAsync(() => queryHomePageData());
  const buildDate = new Date(import.meta.env.VITE_BUILD_DATE);

  useLocalPatch(() => revalidate(queryHomePageData.key));

  return (
    <>
      <AppPage title="" loading={!data()} />

      <Show when={data()}>
        {(data) => {
          const lastPostInfo = () => data().recentPostInfos.items[0];

          const recentMostEngagingPostInfo = () =>
            selectPostInfos(data().recentPostInfos.items, { sortDirection: 'desc', sortKey: 'engagement' }, 1);

          const recentEditorsChoicePostInfo = () =>
            selectPostInfos(data().recentPostInfos.items, { sortKey: 'mark', sortDirection: 'desc' }, 1);

          return (
            <Frame component="main" class={styles.container}>
              <Frame class={styles.about}>
                <div class={styles.info}>
                  <img src={icon} class={styles.icon} alt="screenshot of a tree" width={320} />
                  <section class={styles.heading}>
                    <p class={styles.title}>{localize(texts.app.title)}</p>
                    <p class={styles.description}>{localize(texts.app.description)}</p>
                  </section>
                  <p class={styles.links}>
                    <a href="https://instagram.com/mwscr/" class={styles.link}>
                      Instagram
                    </a>
                    {' • '}
                    <a href="https://vk.com/mwscr" class={styles.link}>
                      VK
                    </a>
                    {' • '}
                    <a href="https://t.me/mwscr" class={styles.link}>
                      Telegram
                    </a>
                    {' • '}
                    <a href="https://www.youtube.com/@mwscr" class={styles.link}>
                      YouTube
                    </a>
                    {' • '}
                    <a href={max.getSubscriptionUrl()} class={styles.link}>
                      {max.name}
                    </a>
                    {' • '}
                    <a href="https://github.com/dehero/mwscr" class={styles.link}>
                      GitHub
                    </a>
                  </p>
                  <p class={styles.version}>
                    v{import.meta.env.VITE_APP_VERSION}
                    {', '}
                    {formatDate(buildDate, currentLocale())}, {formatTime(buildDate, false, currentLocale())}
                  </p>

                  <p class={styles.copyright}>
                    {localize(texts.app.communityNotice, {
                      author: (parts) => (
                        <>
                          <GoldIcon />{' '}
                          <a href={isRu() ? 'https://dehero.ru' : 'https://dehero.site'} class={styles.link}>
                            {parts}
                          </a>
                        </>
                      ),
                      members: (parts) => (
                        <a href={usersRoute.createUrl({})} class={styles.link}>
                          {parts}
                        </a>
                      ),
                    })}
                  </p>
                  <p class={styles.license}>
                    {localize(texts.app.licenseNotice, {
                      cc: (parts) => (
                        <a href="https://github.com/dehero/mwscr/blob/main/LICENSE" class={styles.link}>
                          {parts}
                        </a>
                      ),
                      mit: (parts) => (
                        <a href="https://github.com/dehero/mwscr/blob/main/LICENSE-CODE" class={styles.link}>
                          {parts}
                        </a>
                      ),
                    })}
                  </p>
                  <p class={styles.actions}>
                    <Button href={createDetachedDialogFragment('subscription')}>
                      {localize(texts.support.subscribe)}
                    </Button>

                    <Button href={createDetachedDialogFragment('contributing')}>
                      {localize(texts.contributing.contribute)}
                    </Button>

                    <Button href={createDetachedDialogFragment('sponsorship')}>
                      {localize(texts.support.sponsor)}
                    </Button>
                  </p>
                </div>
                <Divider />

                <Table
                  rows={[
                    {
                      label: localize(postsManagerDescriptors.posts.title),
                      value: data().totalPosts.posts
                        ? () => (
                            <>
                              <GoldIcon class={styles.goldIcon} />
                              {data().totalPosts.posts}
                            </>
                          )
                        : undefined,
                      link: postsRoute.createUrl({ managerName: 'posts' }),
                    },
                    {
                      label: localize(postsManagerDescriptors.extras.title),
                      value: data().totalPosts.extras
                        ? () => (
                            <>
                              <GoldIcon class={styles.goldIcon} />
                              {data().totalPosts.extras}
                            </>
                          )
                        : undefined,
                      link: postsRoute.createUrl({ managerName: 'extras' }),
                    },
                    {
                      label: localize(postsManagerDescriptors.drafts.title),
                      value: data().totalPosts.drafts,
                      link: postsRoute.createUrl({ managerName: 'drafts' }),
                    },
                    {
                      label: localize(postsManagerDescriptors.rejects.title),
                      value: data().totalPosts.rejects,
                      link: postsRoute.createUrl({ managerName: 'rejects' }),
                    },
                    {
                      label: localize(texts.user.users),
                      value: data().membersCount,
                      link: usersRoute.createUrl({}),
                    },
                  ]}
                />
                <Divider />
                <Table
                  label={localize(texts.metrics.summaryCommunityActivity)}
                  rows={[
                    {
                      label: localize(texts.metrics.followers),
                      value: lastPostInfo()?.followers,
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

              <Frame class={styles.posts}>
                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: texts.highlights.lastPost, primary: true, selection: data().recentPostInfos },
                    {
                      label: texts.highlights.lastOriginalPost,
                      primary: true,
                      selection: data().lastOriginalPostInfo,
                    },
                    {
                      label: texts.highlights.recentEngagingPost,
                      primary: true,
                      selection: recentMostEngagingPostInfo(),
                    },
                    {
                      label: texts.highlights.recentEditorsChoicePost,
                      selection: recentEditorsChoicePostInfo(),
                    },
                    {
                      label: texts.highlights.lastFulfilledRequest,
                      selection: data().lastFulfilledPostInfo,
                    },
                    // TODO: Last Week Top Rated Post, Current Month Top Rated Post, Previous Month Top Rated Post etc.
                  ]}
                />

                <PostHighlights
                  class={styles.postHighlights}
                  items={data().lastExtraPostInfos.map(
                    ([type, selection]): PostHighlightsItem => ({
                      label: texts.highlights[`last${capitalize(type)}`],
                      selection,
                    }),
                  )}
                />

                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    {
                      label: texts.highlights.lastDraft,
                      primary: true,
                      selection: data().lastProposedPostInfo,
                    },
                    { label: texts.highlights.lastLocatedPost, selection: data().lastLocatedPostInfo },
                    {
                      label: texts.highlights.lastPendingRequest,
                      selection: data().lastRequestedPostInfo,
                    },
                  ]}
                />
              </Frame>

              <CommentPreviews commentInfos={data().recentCommentInfos} class={styles.comments} />

              <Frame class={styles.diagrams}>
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

                <Divider class={clsx(styles.divider, styles.diagramsDivider)} />

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
              </Frame>
            </Frame>
          );
        }}
      </Show>
    </>
  );
};

export default HomePage;

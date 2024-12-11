import type { JSX } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import icon from '../../../../assets/icon.png?format=avif&imagetools';
import { getPostDateById } from '../../../core/entities/post.js';
import { selectPostInfos } from '../../../core/entities/post-info.js';
import { dateToString, formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { homeRoute } from '../../routes/home-route.js';
import { postRoute } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.js';
import { Diagram } from '../Diagram/Diagram.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { PostHighlights } from '../PostHighlights/PostHighlights.js';
import { PostProposalDialog } from '../PostProposalDialog/PostProposalDialog.js';
import { PostRequestDialog } from '../PostRequestDialog/PostRequestDialog.js';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { Table } from '../Table/Table.js';
import styles from './HomePage.module.css';

export const HomePage = (): JSX.Element => {
  const pageContext = usePageContext();
  const { data } = useRouteInfo(pageContext, homeRoute);
  const [showDialog, setShowDialog] = createSignal<'proposal' | 'request' | undefined>();

  return (
    <>
      <Show when={data()}>
        {(data) => {
          const {
            buildDate,
            totalPosts,
            authorCount,
            requesterCount,
            topRatedPostInfo,
            topLikedPostInfo,
            lastRequestedPostInfo,
            lastProposedPostInfo,
            lastFulfilledPostInfo,
            lastOriginalPostInfo,
            editorsChoicePostInfo,
            totalLikes,
            totalCommentCount,
            recentPostInfos,
          } = data();

          const lastPostInfo = recentPostInfos.items[0];

          const recentMostEngagingPostInfo = () =>
            selectPostInfos(recentPostInfos.items, { sortDirection: 'desc', sortKey: 'engagement' }, 1);

          return (
            <Frame component="main" class={styles.container}>
              <Frame class={styles.about}>
                <img src={icon} class={styles.icon} alt="screenshot of a tree" width={320} />
                <p class={styles.title}>Morrowind Screenshots</p>
                <p class={styles.description}>
                  Original screenshots and videos from The&nbsp;Elder&nbsp;Scrolls&nbsp;III:&nbsp;Morrowind.
                  No&nbsp;third-party mods. No&nbsp;color filters. No&nbsp;interface.
                </p>
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
                  <a href="https://github.com/dehero/mwscr" class={styles.link}>
                    GitHub
                  </a>
                </p>
                <p class={styles.version}>
                  v{import.meta.env.VITE_APP_VERSION}
                  {', '}
                  {formatDate(buildDate)}, {formatTime(buildDate)}
                </p>
                <p class={styles.copyright}>
                  <GoldIcon />{' '}
                  <a href="https://dehero.site" class={styles.link}>
                    dehero
                  </a>
                  {' and '}
                  <a href={usersRoute.createUrl({})} class={styles.link}>
                    contributors
                  </a>
                </p>
                <p class={styles.license}>
                  {'Licenced under '}
                  <a href="https://github.com/dehero/mwscr/blob/main/LICENSE" class={styles.link}>
                    CC-BY-4.0
                  </a>
                  {' and '}
                  <a href="https://github.com/dehero/mwscr/blob/main/LICENSE-CODE" class={styles.link}>
                    MIT
                  </a>
                </p>
                <p class={styles.actions}>
                  <Button onClick={() => setShowDialog('proposal')}>Propose Work</Button>

                  <Button onClick={() => setShowDialog('request')}>Request Post</Button>
                </p>
              </Frame>

              <Frame class={styles.statistics}>
                <Table
                  rows={[
                    {
                      label: 'Posts',
                      value: totalPosts.posts
                        ? () => (
                            <>
                              <GoldIcon class={styles.goldIcon} />
                              {totalPosts.posts}
                            </>
                          )
                        : undefined,
                      link: postsRoute.createUrl({ managerName: 'posts' }),
                    },
                    { label: 'Inbox', value: totalPosts.inbox, link: postsRoute.createUrl({ managerName: 'inbox' }) },
                    { label: 'Trash', value: totalPosts.trash, link: postsRoute.createUrl({ managerName: 'trash' }) },
                  ]}
                />
                <Divider />
                <Table
                  label="Contributors"
                  link={usersRoute.createUrl({})}
                  rows={[
                    {
                      label: 'Authors',
                      value: authorCount,
                      link: usersRoute.createUrl({ role: 'author', sort: 'contribution,desc' }),
                    },
                    {
                      label: 'Requesters',
                      value: requesterCount,
                      link: usersRoute.createUrl({ role: 'requester', sort: 'contribution,desc' }),
                    },
                  ]}
                />
                <Divider />
                <Table
                  label="Total Reactions"
                  rows={[
                    {
                      label: 'Followers',
                      value: lastPostInfo?.followers,
                    },
                    {
                      label: 'Likes',
                      value: totalLikes,
                    },
                    {
                      label: 'Comments',
                      value: totalCommentCount,
                    },
                  ]}
                />
              </Frame>

              <Frame class={styles.posts}>
                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: 'Last Post', primary: true, selection: recentPostInfos },
                    { label: 'Last Original Post', primary: true, selection: lastOriginalPostInfo },
                    { label: 'Recent Engaging Post', primary: true, selection: recentMostEngagingPostInfo() },
                    { label: "Editor's Choice Post", selection: editorsChoicePostInfo },
                    { label: 'Top Rated Post', selection: topRatedPostInfo },
                    { label: 'Top Liked Post', selection: topLikedPostInfo },
                    { label: 'Last Fulfilled Request', selection: lastFulfilledPostInfo },
                    // TODO: Last Week Top Rated Post, Current Month Top Rated Post, Previous Month Top Rated Post etc.
                  ]}
                />

                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: 'Last Proposal', primary: true, selection: lastProposedPostInfo },
                    { label: 'Last Pending Request', selection: lastRequestedPostInfo },
                  ]}
                />
              </Frame>

              <Frame class={styles.diagrams}>
                <Diagram
                  class={styles.diagram}
                  label="Followers Count"
                  items={recentPostInfos.items}
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
                  label="Recent Posts Engagement"
                  items={recentPostInfos.items}
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

      <PostProposalDialog show={showDialog() === 'proposal'} onClose={() => setShowDialog(undefined)} />

      <PostRequestDialog show={showDialog() === 'request'} onClose={() => setShowDialog(undefined)} />
    </>
  );
};

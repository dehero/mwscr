import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
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
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Diagram } from '../Diagram/Diagram.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { PostHighlights } from '../PostHighlights/PostHighlights.js';
import { PostTooltip } from '../PostTooltip/PostTooltip.js';
import { Table } from '../Table/Table.js';
import styles from './HomePage.module.css';

export const HomePage = (): JSX.Element => {
  const pageContext = usePageContext();
  const { data } = useRouteInfo(pageContext, homeRoute);

  return (
    <>
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
                <img src={icon} class={styles.icon} alt="screenshot of a tree" width={320} />
                <section class={styles.heading}>
                  <p class={styles.title}>Morrowind Screenshots</p>
                  <p class={styles.description}>
                    Original screenshots and videos from The&nbsp;Elder&nbsp;Scrolls&nbsp;III:&nbsp;Morrowind.
                    No&nbsp;third-party mods. No&nbsp;color filters. No&nbsp;interface.
                  </p>
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
                  <a href="https://github.com/dehero/mwscr" class={styles.link}>
                    GitHub
                  </a>
                </p>
                <p class={styles.version}>
                  v{import.meta.env.VITE_APP_VERSION}
                  {', '}
                  {formatDate(data().buildDate)}, {formatTime(data().buildDate)}
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
                  <Button href={createDetachedDialogFragment('subscription')}>Subscribe</Button>

                  <Button href={createDetachedDialogFragment('contributing')}>Contribute</Button>

                  <Button href={createDetachedDialogFragment('sponsorship')}>Sponsor</Button>
                </p>
              </Frame>

              <Frame class={styles.statistics}>
                <Table
                  rows={[
                    {
                      label: 'Posts',
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
                      label: 'Inbox',
                      value: data().totalPosts.inbox,
                      link: postsRoute.createUrl({ managerName: 'inbox' }),
                    },
                    {
                      label: 'Trash',
                      value: data().totalPosts.trash,
                      link: postsRoute.createUrl({ managerName: 'trash' }),
                    },
                  ]}
                />
                <Divider />
                <Table
                  label="Contributors"
                  link={usersRoute.createUrl({})}
                  rows={[
                    {
                      label: 'Authors',
                      value: data().authorCount,
                      link: usersRoute.createUrl({ role: 'author', sort: 'contribution,desc' }),
                    },
                    {
                      label: 'Requesters',
                      value: data().requesterCount,
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
                      value: lastPostInfo()?.followers,
                    },
                    {
                      label: 'Likes',
                      value: data().totalLikes,
                    },
                    {
                      label: 'Comments',
                      value: data().totalCommentCount,
                    },
                  ]}
                />
              </Frame>

              <Frame class={styles.hero}>
                <p class={styles.heroText}>
                  Dear followers! I would like to share with you an interview conducted by game blogger Dmitry Epikhin.
                  It is entirely dedicated to the story of the Morrowind Screenshots project and Morrowind in general.
                  Enjoy reading it!
                </p>

                <p class={styles.heroText}>
                  <a
                    href="https://medium.com/@dmepikh/ive-been-photographing-morrowind-for-15-years-interview-with-the-founder-of-the-morrowind-a5ee65712217"
                    class={styles.link}
                  >
                    Medium (English)
                  </a>
                  {' • '}
                  <a
                    href="https://dtf.ru/screenshots/3312760-fotografiruyu-morrowind-uzhe-15-let-intervyu-s-osnovatelem-proekta-morrowind-screenshots"
                    class={styles.link}
                  >
                    DTF (Russian)
                  </a>
                  {' • '}
                  <a
                    href="https://stopgame.ru/blogs/topic/117167/fotografiruyu_morrowind_uzhe_15_let_interview_s_osnovatelem_proekta_morrowind_screenshots"
                    class={styles.link}
                  >
                    StopGame (Russian)
                  </a>
                </p>
              </Frame>

              <Frame class={styles.posts}>
                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: 'Last Post', primary: true, selection: data().recentPostInfos },
                    { label: 'Last Original Post', primary: true, selection: data().lastOriginalPostInfo },
                    { label: 'Recent Engaging Post', primary: true, selection: recentMostEngagingPostInfo() },
                    { label: "Recent Editor's Choice Post", selection: recentEditorsChoicePostInfo() },
                    { label: 'Last Fulfilled Request', selection: data().lastFulfilledPostInfo },
                    // TODO: Last Week Top Rated Post, Current Month Top Rated Post, Previous Month Top Rated Post etc.
                  ]}
                />

                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: 'Last Proposal', primary: true, selection: data().lastProposedPostInfo },
                    { label: 'Last Pending Request', selection: data().lastRequestedPostInfo },
                  ]}
                />
              </Frame>

              <Frame class={styles.diagrams}>
                <Diagram
                  class={styles.diagram}
                  label="Followers Count"
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
                  label="Recent Posts Engagement"
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

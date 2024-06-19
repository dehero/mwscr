import { type Component } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { usePageContext } from 'vike-solid/usePageContext';
import icon from '../../../../assets/icon.png';
import pkg from '../../../../package.json';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { UserContribution } from '../../../core/entities/user.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { PostHighlights } from '../PostHighlights/PostHighlights.jsx';
import { Table } from '../Table/Table.js';
import styles from './HomePage.module.css';

export interface HomePageData {
  totalPosts: UserContribution;
  authorCount: number;
  requesterCount: number;
  lastPostInfo?: PostInfo;
  lastOriginalPostInfo?: PostInfo;
  topRatedPostInfo?: PostInfo;
  topLikedPostInfo?: PostInfo;
  lastFulfilledPostInfo?: PostInfo;
  lastProposedPostInfo?: PostInfo;
  lastRequestedPostInfo?: PostInfo;
  editorsChoicePostInfo?: PostInfo;
}

export const HomePage: Component = () => {
  const buildDate = usePageContext().buildDate;

  const {
    totalPosts,
    authorCount,
    requesterCount,
    lastPostInfo,
    topRatedPostInfo,
    topLikedPostInfo,
    lastRequestedPostInfo,
    lastProposedPostInfo,
    lastFulfilledPostInfo,
    lastOriginalPostInfo,
    editorsChoicePostInfo,
  } = useData<HomePageData>();

  return (
    <>
      <Divider class={styles.divider} />
      <section class={styles.container}>
        <Frame class={styles.about}>
          <img src={icon} class={styles.icon} />
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
            v{typeof pkg === 'object' && 'version' in pkg && typeof pkg.version === 'string' ? pkg.version : undefined}
            {', '}
            {buildDate.toLocaleDateString('en-GB')}
          </p>
        </Frame>
        <Frame class={styles.statistics}>
          <Table
            label="Posts"
            // value={() => <Button>Submit</Button>}
            rows={[
              {
                label: 'Published',
                value: totalPosts.published
                  ? () => (
                      <>
                        <GoldIcon class={styles.goldIcon} />
                        {totalPosts.published}
                      </>
                    )
                  : undefined,
              },
              { label: 'Pending', value: totalPosts.pending },
              { label: 'Rejected', value: totalPosts.rejected },
            ]}
          />
          <Divider />
          <Table
            label="Contributors"
            rows={[
              { label: 'Authors', value: authorCount },
              { label: 'Requesters', value: requesterCount },
            ]}
          />
        </Frame>

        <Frame class={styles.posts}>
          <PostHighlights
            items={[
              { label: 'Last Post', primary: true, postInfo: lastPostInfo },
              { label: 'Last Original Post', primary: true, postInfo: lastOriginalPostInfo },
              { label: 'Top Rated Post', postInfo: topRatedPostInfo },
              { label: "Editor's Choice Post", postInfo: editorsChoicePostInfo },
              { label: 'Top Liked Post', postInfo: topLikedPostInfo },
              { label: 'Last Fulfilled Request', postInfo: lastFulfilledPostInfo },
              // TODO: Last Week Top Rated Post, Current Month Top Rated Post, Previous Month Top Rated Post etc.
            ]}
          />

          <PostHighlights
            items={[
              { label: 'Last Proposal', primary: true, postInfo: lastProposedPostInfo },
              { label: 'Last Pending Request', postInfo: lastRequestedPostInfo },
            ]}
          />
        </Frame>
      </section>
    </>
  );
};

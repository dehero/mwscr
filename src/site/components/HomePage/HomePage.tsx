import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import icon from '../../../../assets/icon.png';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { UserContribution } from '../../../core/entities/user.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Label } from '../Label/Label.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import { Table } from '../Table/Table.js';
import styles from './HomePage.module.css';
import { Button } from '../Button/Button.jsx';

export interface HomePageData {
  totalPosts: UserContribution;
  authorCount: number;
  requesterCount: number;
  lastPostInfo?: PostInfo;
  topRatedPostInfo?: PostInfo;
  topLikedPostInfo?: PostInfo;
}

export const HomePage: Component = () => {
  const { totalPosts, authorCount, requesterCount, lastPostInfo, topRatedPostInfo, topLikedPostInfo } =
    useData<HomePageData>();

  return (
    <>
      <Divider class={styles.divider} />
      <section class={styles.container}>
        <Frame class={styles.about}>
          <img src={icon} />
          <p class={styles.title}>Morrowind Screenshots</p>
          <p class={styles.description}>
            Original screenshots and videos from&nbsp;The&nbsp;Elder&nbsp;Scrolls&nbsp;III:&nbsp;Morrowind.
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
          <Show when={lastPostInfo}>
            {(postInfo) => (
              <Label label="Last Post" vertical class={clsx(styles.post, styles.primary)}>
                <PostPreview postInfo={postInfo()} managerName="published" />
              </Label>
            )}
          </Show>
          <Show when={topRatedPostInfo}>
            {(postInfo) => (
              <Label label="Top Rated Post" vertical class={styles.post}>
                <PostPreview postInfo={postInfo()} managerName="published" />
              </Label>
            )}
          </Show>
          <Show when={topLikedPostInfo}>
            {(postInfo) => (
              <Label label="Top Liked Post" vertical class={styles.post}>
                <PostPreview postInfo={postInfo()} managerName="published" />
              </Label>
            )}
          </Show>
          {/* <Label label="Last Week Top Rated Post" vertical class={styles.post}>
          TODO
        </Label>
        <Label label="Current Month Top Rated Post" vertical class={styles.post}>
          TODO
        </Label>
        <Label label="Previous Month Top Rated Post" vertical class={styles.post}>
          TODO
        </Label> */}
        </Frame>
      </section>
    </>
  );
};

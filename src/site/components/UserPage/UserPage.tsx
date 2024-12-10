import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import type { JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import { isPostsUsageEmpty } from '../../../core/entities/posts-usage.js';
import { telegram, TELEGRAM_BOT_NAME } from '../../../core/services/telegram.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Input } from '../Input/Input.js';
import { PostHighlights } from '../PostHighlights/PostHighlights.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Table } from '../Table/Table.js';
import { useToaster } from '../Toaster/Toaster.js';
import styles from './UserPage.module.css';

export const UserPage = (): JSX.Element => {
  const { addToast } = useToaster();

  const pageContext = usePageContext();
  const { data, params } = useRouteInfo(pageContext, userRoute);
  const id = () => params().id;

  const copyIdToClipboard = () => {
    writeClipboard(id());
    addToast('User ID copied to clipboard');
  };

  return (
    <Show when={data().userInfo}>
      {(userInfo) => (
        <Frame component="main" class={styles.container}>
          <Frame component="section" variant="thin" class={styles.main}>
            <div class={styles.info}>
              <Icon class={styles.icon} color={userInfo().roles.includes('author') ? 'stealth' : 'magic'}>
                {userInfo().title[0]?.toLocaleUpperCase()}
              </Icon>

              <p class={styles.title}>{userInfo().title}</p>

              <Show when={userInfo().roles.length > 0}>
                <p class={styles.roles}>{userInfo().roles.join(', ')}</p>
              </Show>
            </div>

            <Show when={data().userLinks && data().userLinks!.length > 0}>
              <p class={styles.links}>
                <For each={data().userLinks}>
                  {(link, index) => (
                    <>
                      <Show when={index() > 0}> • </Show>
                      <a href={link.url} class={styles.link}>
                        {link.text}
                      </a>
                    </>
                  )}
                </For>
              </p>
            </Show>

            <Show when={!isPostsUsageEmpty(userInfo().authored)}>
              <Divider />

              <Table
                class={styles.attributes}
                label="Authored"
                rows={[
                  {
                    label: 'Posts',
                    value: userInfo().authored?.posts
                      ? () => (
                          <>
                            <GoldIcon class={styles.goldIcon} />
                            {userInfo().authored!.posts}
                          </>
                        )
                      : undefined,
                    link: postsRoute.createUrl({ managerName: 'posts', author: id(), original: 'true' }),
                  },
                  {
                    label: 'Inbox',
                    value: userInfo().authored?.inbox,
                    link: postsRoute.createUrl({ managerName: 'inbox', author: id() }),
                  },
                  {
                    label: 'Trash',
                    value: userInfo().authored?.trash,
                    link: postsRoute.createUrl({ managerName: 'trash', author: id() }),
                  },
                ]}
              />
            </Show>

            <Show when={!isPostsUsageEmpty(userInfo().requested)}>
              <Divider />

              <Table
                class={styles.attributes}
                label="Requested"
                rows={[
                  {
                    label: 'Posts',
                    value: userInfo().requested?.posts,
                    link: postsRoute.createUrl({ managerName: 'posts', requester: id() }),
                  },
                  {
                    label: 'Inbox',
                    value: userInfo().requested?.inbox,
                    link: postsRoute.createUrl({ managerName: 'inbox', requester: id() }),
                  },
                  {
                    label: 'Trash',
                    value: userInfo().requested?.trash,
                    link: postsRoute.createUrl({ managerName: 'trash', requester: id() }),
                  },
                ]}
              />
            </Show>

            <Show when={userInfo().rating}>
              <Divider />

              <Table
                label="Average Content Score"
                class={styles.attributes}
                rows={[
                  {
                    label: "Editor's Mark",
                    value: userInfo().mark
                      ? () => (
                          <>
                            <Icon
                              color="combat"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {userInfo().mark?.[0]}
                            </Icon>
                            {userInfo().mark?.[1]}
                          </>
                        )
                      : undefined,
                  },
                  { label: 'Rating', value: userInfo().rating },
                ]}
              />
            </Show>

            <Show when={userInfo().likes || userInfo().views || userInfo().engagement}>
              <Divider />

              <Table
                label="Total Reactions"
                class={styles.attributes}
                rows={[
                  { label: 'Likes', value: userInfo().likes },
                  { label: 'Views', value: userInfo().views },
                  { label: 'Average Engagement', value: userInfo().engagement },
                ]}
              />
            </Show>

            <Show when={userInfo().talkedToTelegramBot}>
              <Divider />

              <p class={styles.talkedToTelegramBot}>
                Talked to{' '}
                <a href={telegram.getUserProfileUrl(TELEGRAM_BOT_NAME)} class={styles.link}>
                  Ordinator
                </a>
              </p>
            </Show>

            <Spacer />

            <div class={styles.id}>
              <Input value={params().id} readonly />
              <Button class={styles.copy} onClick={copyIdToClipboard}>
                Copy
              </Button>
            </div>
          </Frame>

          <Frame component="section" class={styles.posts}>
            <PostHighlights
              class={styles.postHighlights}
              items={[
                { label: 'Last Post', primary: true, selection: data().lastPostInfo },
                { label: 'Last Original Post', primary: true, selection: data().lastOriginalPostInfo },
                { label: 'First Post', selection: data().firstPostInfo },
                { label: 'Top Rated Post', selection: data().topRatedPostInfo },
                { label: "Editor's Choice Post", selection: data().editorsChoicePostInfo },
                { label: 'Top Liked Post', selection: data().topLikedPostInfo },
                { label: 'Less Liked Post', selection: data().lessLikedPostInfo },
                { label: 'Last Fulfilled Request', selection: data().lastFulfilledPostInfo },
              ]}
            />

            <PostHighlights
              class={styles.postHighlights}
              items={[
                { label: 'Last Proposal', primary: true, selection: data().lastProposedPostInfo },
                { label: 'Last Pending Request', selection: data().lastRequestedPostInfo },
                { label: 'Last Rejected Proposal', selection: data().lastRejectedPostInfo },
                { label: 'Last Rejected Request', selection: data().lastRejectedRequestInfo },
              ]}
            />
          </Frame>
        </Frame>
      )}
    </Show>
  );
};

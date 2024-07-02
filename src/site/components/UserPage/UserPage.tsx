import { writeClipboard } from '@solid-primitives/clipboard';
import { type Component, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { UserInfo } from '../../../core/entities/user.js';
import { isUserContributionEmpty } from '../../../core/entities/user.js';
import { useParams } from '../../hooks/useParams.js';
import { postsRoute } from '../../routes/posts-route.js';
import type { UserRouteParams } from '../../routes/user-route.js';
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

export interface UserPageData {
  userInfo?: UserInfo;
  lastPostInfo?: PostInfo;
  lastOriginalPostInfo?: PostInfo;
  firstPostInfo?: PostInfo;
  topRatedPostInfo?: PostInfo;
  topLikedPostInfo?: PostInfo;
  lessLikedPostInfo?: PostInfo;
  lastFulfilledPostInfo?: PostInfo;
  lastProposedPostInfo?: PostInfo;
  lastRequestedPostInfo?: PostInfo;
  lastRejectedPostInfo?: PostInfo;
  lastRejectedRequestInfo?: PostInfo;
  editorsChoicePostInfo?: PostInfo;
}

export const UserPage: Component = () => {
  const { addToast } = useToaster();
  const params = useParams<UserRouteParams>();
  const {
    userInfo,
    lastPostInfo,
    lastOriginalPostInfo,
    firstPostInfo,
    topRatedPostInfo,
    topLikedPostInfo,
    lessLikedPostInfo,
    lastFulfilledPostInfo,
    lastProposedPostInfo,
    lastRequestedPostInfo,
    lastRejectedPostInfo,
    lastRejectedRequestInfo,
    editorsChoicePostInfo,
  } = useData<UserPageData>();

  const id = () => params().id;

  const copyIdToClipboard = () => {
    writeClipboard(id());
    addToast('User ID copied to clipboard');
  };

  return (
    <Show when={userInfo}>
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

            <Show when={!isUserContributionEmpty(userInfo().authored)}>
              <Divider />

              <Table
                class={styles.attributes}
                label="Authored"
                rows={[
                  {
                    label: 'Published',
                    value: userInfo().authored.published
                      ? () => (
                          <>
                            <GoldIcon class={styles.goldIcon} />
                            {userInfo().authored.published}
                          </>
                        )
                      : undefined,
                    link: postsRoute.createUrl({ managerName: 'published', author: id() }),
                  },
                  {
                    label: 'Pending',
                    value: userInfo().authored.pending,
                    link: postsRoute.createUrl({ managerName: 'index', author: id() }),
                  },
                  {
                    label: 'Rejected',
                    value: userInfo().authored.rejected,
                    link: postsRoute.createUrl({ managerName: 'trash', author: id() }),
                  },
                ]}
              />
            </Show>

            <Show when={!isUserContributionEmpty(userInfo().requested)}>
              <Divider />

              <Table
                class={styles.attributes}
                label="Requested"
                rows={[
                  {
                    label: 'Published',
                    value: userInfo().requested.published,
                    link: postsRoute.createUrl({ managerName: 'published', requester: id() }),
                  },
                  {
                    label: 'Pending',
                    value: userInfo().requested.pending,
                    link: postsRoute.createUrl({ managerName: 'inbox', requester: id() }),
                  },
                  {
                    label: 'Rejected',
                    value: userInfo().requested.rejected,
                    link: postsRoute.createUrl({ managerName: 'trash', requester: id() }),
                  },
                ]}
              />
            </Show>

            <Show when={userInfo().likes}>
              <Divider />

              <Table class={styles.attributes} rows={[{ label: 'Likes', value: userInfo().likes }]} />
            </Show>

            <Spacer />

            <div class={styles.id}>
              <Input value={id()} readonly />
              <Button class={styles.copy} onClick={copyIdToClipboard}>
                Copy
              </Button>
            </div>
          </Frame>

          <Frame component="section" class={styles.posts}>
            <PostHighlights
              class={styles.postHighlights}
              items={[
                { label: 'Last Post', primary: true, postInfo: lastPostInfo },
                { label: 'Last Original Post', primary: true, postInfo: lastOriginalPostInfo },
                { label: 'First Post', primary: true, postInfo: firstPostInfo },
                { label: 'Top Rated Post', postInfo: topRatedPostInfo },
                { label: "Editor's Choice Post", postInfo: editorsChoicePostInfo },
                { label: 'Top Liked Post', postInfo: topLikedPostInfo },
                { label: 'Less Liked Post', postInfo: lessLikedPostInfo },
                { label: 'Last Fulfilled Request', postInfo: lastFulfilledPostInfo },
              ]}
            />

            <PostHighlights
              class={styles.postHighlights}
              items={[
                { label: 'Last Proposal', primary: true, postInfo: lastProposedPostInfo },
                { label: 'Last Pending Request', postInfo: lastRequestedPostInfo },
                { label: 'Last Rejected Proposal', postInfo: lastRejectedPostInfo },
                { label: 'Last Rejected Request', postInfo: lastRejectedRequestInfo },
              ]}
            />
          </Frame>
        </Frame>
      )}
    </Show>
  );
};

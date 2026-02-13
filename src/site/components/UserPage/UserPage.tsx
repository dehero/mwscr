import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import type { JSX } from 'solid-js';
import { createResource, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { usePageContext } from 'vike-solid/usePageContext';
import { postTypeDescriptors } from '../../../core/entities/post.js';
import { postsManagerDescriptors, PostsManagerName } from '../../../core/entities/posts-manager.js';
import { isPostsUsageEmpty } from '../../../core/entities/posts-usage.js';
import { services } from '../../../core/services/index.js';
import { telegram, TELEGRAM_BOT_NAME } from '../../../core/services/telegram.js';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { CommentPreviews } from '../CommentPreviews/CommentPreviews.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Input } from '../Input/Input.js';
import type { PostHighlightsItem } from '../PostHighlights/PostHighlights.js';
import { PostHighlights } from '../PostHighlights/PostHighlights.js';
import { getPostsPageSearchParamsFromSelectionParams } from '../PostsPage/PostsPage.data.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Table } from '../Table/Table.js';
import { Toast, useToaster } from '../Toaster/Toaster.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import styles from './UserPage.module.css';

export const UserPage = (): JSX.Element => {
  const { addToast } = useToaster();

  const pageContext = usePageContext();
  const { data, params, loading } = useRouteInfo(pageContext, userRoute);
  const id = () => params().id;

  const copyIdToClipboard = () => {
    writeClipboard(id());
    addToast('User ID copied to clipboard');
  };

  const [userInfo, { refetch }] = createResource(params, ({ id }) => dataManager.getUserInfo(id));

  useLocalPatch(refetch);

  return (
    <>
      <Toast message="Loading Page" show={loading() || userInfo.loading} loading />
      <Show when={userInfo()}>
        {(userInfo) => (
          <Frame component="main" class={styles.container}>
            <Frame component="section" variant="thin" class={styles.main}>
              <div class={styles.avatarWrapper}>
                <UserAvatar image={userInfo().avatar} title={userInfo().title} class={styles.avatar} size="original" />
              </div>

              <div class={styles.info}>
                <section class={styles.titles}>
                  <p class={styles.title}>{userInfo().title}</p>

                  <Show when={userInfo().titleRu && userInfo().titleRu !== userInfo().title}>
                    <p class={styles.titleRu}>{userInfo().titleRu}</p>
                  </Show>
                </section>

                <Show when={userInfo().roles.length > 0}>
                  <p class={styles.roles}>{userInfo().roles.join(', ')}</p>
                </Show>

                <Show when={data().profiles && data().profiles!.length > 0}>
                  <p class={styles.links}>
                    <For each={data().profiles}>
                      {(profile, index) => {
                        const service = services.find((service) => service.id === profile.service);
                        const url = profile.username && service?.getUserProfileUrl(profile.username);
                        const attributes = [
                          profile.type,
                          !profile.username && 'anonimous',
                          profile.deleted && 'deleted',
                        ]
                          .filter(Boolean)
                          .join(', ');

                        return (
                          <>
                            <Show when={index() > 0}>{' • '}</Show>
                            <Dynamic component={url ? 'a' : 'span'} href={url} class={styles.link}>
                              <Show when={profile.avatar}>
                                <UserAvatar
                                  image={profile.avatar}
                                  title={profile.name || profile.username || profile.service}
                                  class={styles.linkAvatar}
                                  size="small"
                                />
                              </Show>
                              {service?.name}
                              <Show when={attributes}> ({attributes})</Show>
                            </Dynamic>
                          </>
                        );
                      }}
                    </For>
                  </p>
                </Show>
              </div>

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
                    ...data().lastExtraPostInfos.map(([type, selection]) => ({
                      label: postTypeDescriptors[type].titleMultiple,
                      link: postsRoute.createUrl({
                        managerName: 'extras',
                        ...getPostsPageSearchParamsFromSelectionParams(selection?.params),
                      }),
                      value: selection?.totalCount
                        ? () => (
                            <>
                              <GoldIcon class={styles.goldIcon} />
                              {selection.totalCount}
                            </>
                          )
                        : undefined,
                    })),
                    {
                      label: 'Drafts',
                      value: userInfo().authored?.drafts,
                      link: postsRoute.createUrl({ managerName: 'drafts', author: id() }),
                    },
                    {
                      label: 'Rejects',
                      value: userInfo().authored?.rejects,
                      link: postsRoute.createUrl({ managerName: 'rejects', author: id() }),
                    },
                  ]}
                />
              </Show>

              <Show when={!isPostsUsageEmpty(userInfo().located)}>
                <Divider />

                <Table
                  class={styles.attributes}
                  label="Located"
                  rows={PostsManagerName.options.map((name) => ({
                    label: postsManagerDescriptors[name].title,
                    value: userInfo().located?.[name],
                    link: postsRoute.createUrl({
                      managerName: name,
                      locator: id(),
                      original: 'true',
                      sort: 'located,desc',
                    }),
                  }))}
                />
              </Show>

              <Show when={!isPostsUsageEmpty(userInfo().requested)}>
                <Divider />

                <Table
                  class={styles.attributes}
                  label="Requested"
                  rows={PostsManagerName.options.map((name) => ({
                    label: postsManagerDescriptors[name].title,
                    value: userInfo().requested?.[name],
                    link: postsRoute.createUrl({
                      managerName: name,
                      requester: id(),
                      original: 'true',
                      sort: 'requested,desc',
                    }),
                  }))}
                />
              </Show>

              <Show when={!isPostsUsageEmpty(userInfo().commented)}>
                <Divider />

                <Table
                  class={styles.attributes}
                  label="Commented"
                  rows={PostsManagerName.options.map((name) => ({
                    label: postsManagerDescriptors[name].title,
                    value: userInfo().commented?.[name],
                  }))}
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

            <CommentPreviews commentInfos={data().commentInfos} class={styles.comments} hideAuthorName />

            <Frame component="section" class={styles.posts}>
              <Show
                when={
                  data().lastPostInfo ||
                  data().lastOriginalPostInfo ||
                  data().firstPostInfo ||
                  data().topRatedPostInfo ||
                  data().editorsChoicePostInfo ||
                  data().topLikedPostInfo ||
                  data().lessLikedPostInfo ||
                  data().lastFulfilledPostInfo ||
                  data().lastExtraPostInfos.length > 0 ||
                  data().lastProposedPostInfo ||
                  data().lastLocatedPostInfo ||
                  data().lastRequestedPostInfo ||
                  data().lastRejectedPostInfo ||
                  data().lastRejectedRequestInfo
                }
                fallback={<p class={styles.fallbackText}>No posts yet</p>}
              >
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
                  items={data().lastExtraPostInfos.map(
                    ([type, selection]): PostHighlightsItem => ({
                      label: `Last ${postTypeDescriptors[type].title}` as PostHighlightsItem['label'],
                      primary: true,
                      selection,
                    }),
                  )}
                />

                <PostHighlights
                  class={styles.postHighlights}
                  items={[
                    { label: 'Last Proposal', primary: true, selection: data().lastProposedPostInfo },
                    { label: 'Last Located Post', selection: data().lastLocatedPostInfo },
                    { label: 'Last Pending Request', selection: data().lastRequestedPostInfo },
                    { label: 'Last Rejected Proposal', selection: data().lastRejectedPostInfo },
                    { label: 'Last Rejected Request', selection: data().lastRejectedRequestInfo },
                  ]}
                />
              </Show>
            </Frame>
          </Frame>
        )}
      </Show>
    </>
  );
};

import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { UserInfo } from '../../../core/entities/user.js';
import { isUserContributionEmpty } from '../../../core/entities/user.js';
import { useParams } from '../../hooks/useParams.js';
import type { UserRouteParams } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import { Table } from '../Table/Table.js';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './UserPage.module.css';

export interface UserPageData {
  userInfo?: UserInfo;
  lastPostInfo?: PostInfo;
  firstPostInfo?: PostInfo;
  topRatedPostInfo?: PostInfo;
  topLikedPostInfo?: PostInfo;
  lessLikedPostInfo?: PostInfo;
}

export const UserPage: Component = () => {
  const { addToast } = useToaster();
  const params = useParams<UserRouteParams>();
  const { userInfo, lastPostInfo, firstPostInfo, topRatedPostInfo, topLikedPostInfo, lessLikedPostInfo } =
    useData<UserPageData>();

  const id = () => params.id;

  const copyIdToClipboard = () => {
    writeClipboard(id());
    addToast('User ID copied to clipboard');
  };

  return (
    <>
      <Divider class={styles.divider} />
      <Show when={userInfo}>
        {(userInfo) => (
          <section class={styles.container}>
            <Frame component="section" variant="thin" class={styles.main}>
              <div class={styles.info}>
                <Icon class={styles.icon} color={userInfo().roles.includes('author') ? 'stealth' : 'magic'}>
                  {userInfo().title[0]?.toLocaleUpperCase()}
                </Icon>

                <h1 class={styles.title}>{userInfo().title}</h1>

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
                      value: userInfo().authored.published ? (
                        <>
                          <GoldIcon class={styles.goldIcon} />
                          {userInfo().authored.published}
                        </>
                      ) : undefined,
                    },
                    { label: 'Pending', value: userInfo().authored.pending },
                    { label: 'Rejected', value: userInfo().authored.rejected },
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
                    },
                    { label: 'Pending', value: userInfo().requested.pending },
                    { label: 'Rejected', value: userInfo().requested.rejected },
                  ]}
                />
              </Show>

              <Show when={userInfo().likes}>
                <Divider />

                <Table class={styles.attributes} rows={[{ label: 'Likes', value: userInfo().likes }]} />
              </Show>

              <div class={styles.id}>
                <Input value={id()} readonly />
                <Button class={styles.copy} onClick={copyIdToClipboard}>
                  Copy
                </Button>
              </div>

              <div class={styles.spacer} />
            </Frame>

            <Frame component="section" variant="thin" class={styles.posts}>
              <Show when={lastPostInfo}>
                {(postInfo) => (
                  <Label label="Last Post" vertical class={clsx(styles.post, styles.primary)}>
                    <PostPreview postInfo={postInfo()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={topRatedPostInfo}>
                {(postInfo) => (
                  <Label label="Top Rated Post" vertical class={clsx(styles.post, styles.primary)}>
                    <PostPreview postInfo={postInfo()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={topLikedPostInfo}>
                {(postInfo) => (
                  <Label label="Top Liked Post" vertical class={clsx(styles.post)}>
                    <PostPreview postInfo={postInfo()} managerName="published" />
                  </Label>
                )}
              </Show>
              <Show when={firstPostInfo}>
                {(postInfo) => (
                  <Label label="First Post" vertical class={styles.post}>
                    <PostPreview postInfo={postInfo()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={lessLikedPostInfo}>
                {(postInfo) => (
                  <Label label="Less Liked Post" vertical class={styles.post}>
                    <PostPreview postInfo={postInfo()} managerName="published" />
                  </Label>
                )}
              </Show>
            </Frame>
          </section>
        )}
      </Show>
    </>
  );
};

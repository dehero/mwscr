import { writeClipboard } from '@solid-primitives/clipboard';
import { useParams } from '@solidjs/router';
import clsx from 'clsx';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import { createUserInfo, isUserContributionEmpty } from '../../../core/entities/user.js';
import { Button } from '../../components/Button/Button.js';
import { Divider } from '../../components/Divider/Divider.js';
import { Frame } from '../../components/Frame/Frame.js';
import { GoldIcon } from '../../components/GoldIcon/GoldIcon.js';
import { Icon } from '../../components/Icon/Icon.js';
import { Input } from '../../components/Input/Input.js';
import { Label } from '../../components/Label/Label.jsx';
import { Page } from '../../components/Page/Page.js';
import { PostPreview } from '../../components/PostPreview/PostPreview.jsx';
import { Table } from '../../components/Table/Table.js';
import { inbox, published, trash } from '../../data-managers/posts.js';
import { users } from '../../data-managers/users.js';
import type { UserRouteParams } from '../../routes/user-route.js';
import styles from './UserPage.module.css';

async function getUserInfo(id: string) {
  return createUserInfo(await users.getEntry(id), published, inbox, trash);
}

export const UserPage: Component = () => {
  const params = useParams<UserRouteParams>();

  const id = () => params.id;
  const [userInfo] = createResource(id, getUserInfo);

  const [showIdCopiedMessage, setShowIdCopiedMessage] = createSignal(false);

  const copyIdToClipboard = () => {
    writeClipboard(id());
    setShowIdCopiedMessage(true);
    setTimeout(() => setShowIdCopiedMessage(false), 2000);
  };

  return (
    <Page title={userInfo()?.title || id()} status={showIdCopiedMessage() ? 'Copied user ID to clipboard' : undefined}>
      <Divider class={styles.divider} />
      <Show when={userInfo()}>
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
              <Show when={userInfo().lastPostEntry}>
                {(postEntry) => (
                  <Label label="Last Post" vertical class={clsx(styles.post, styles.primary)}>
                    <PostPreview postEntry={postEntry()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={userInfo().topRatedPostEntry}>
                {(postEntry) => (
                  <Label label="Top Rated Post" vertical class={clsx(styles.post, styles.primary)}>
                    <PostPreview postEntry={postEntry()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={userInfo().topLikedPostEntry}>
                {(postEntry) => (
                  <Label label="Top Liked Post" vertical class={clsx(styles.post)}>
                    <PostPreview postEntry={postEntry()} managerName="published" />
                  </Label>
                )}
              </Show>
              <Show when={userInfo().firstPostEntry}>
                {(postEntry) => (
                  <Label label="First Post" vertical class={styles.post}>
                    <PostPreview postEntry={postEntry()} managerName="published" />
                  </Label>
                )}
              </Show>

              <Show when={userInfo().lessLikedPostEntry}>
                {(postEntry) => (
                  <Label label="Less Liked Post" vertical class={styles.post}>
                    <PostPreview postEntry={postEntry()} managerName="published" />
                  </Label>
                )}
              </Show>
            </Frame>
          </section>
        )}
      </Show>
    </Page>
  );
};

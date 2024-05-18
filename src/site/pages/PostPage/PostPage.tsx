import { writeClipboard } from '@solid-primitives/clipboard';
import { useParams } from '@solidjs/router';
import clsx from 'clsx';
import { type Component, createResource, createSignal, For, Match, Show, Switch } from 'solid-js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { youtube } from '../../../core/services/youtube.js';
import { store } from '../../../core/stores/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Button } from '../../components/Button/Button.js';
import { Divider } from '../../components/Divider/Divider.js';
import { Frame } from '../../components/Frame/Frame.js';
import frameStyles from '../../components/Frame/Frame.module.css';
import { Input } from '../../components/Input/Input.js';
import { Page } from '../../components/Page/Page.js';
import { PostComments } from '../../components/PostComments/PostComments.js';
import { PostEditingDialog } from '../../components/PostEditingDialog/PostEditingDialog.js';
import { PostLocationDialog } from '../../components/PostLocationDialog/PostLocationDialog.js';
import { PostPublications } from '../../components/PostPublications/PostPublications.js';
import { ResourcePreview } from '../../components/ResourcePreview/ResourcePreview.js';
import { Table } from '../../components/Table/Table.js';
import { inbox, published, trash } from '../../data-managers/posts.js';
import { users } from '../../data-managers/users.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import styles from './PostPage.module.css';

export const PostPage: Component = () => {
  const params = useParams<PostRouteParams>();

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);

  const manager = [published, inbox, trash].find((m) => m.name === params.managerName);
  const id = () => params.id;
  const [post] = createResource(() => manager?.getItem(id()));

  const title = () => post()?.title || 'Untitled';
  const titleRu = () => post()?.titleRu || 'Без названия';
  const content = () => asArray(post()?.content);
  const contentPublicUrls = () => content().map((url) => store.getPublicUrl(parseResourceUrl(url).pathname));
  const [authors] = createResource(() => asArray(post()?.author), users.getEntries.bind(users));

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => post()?.posts?.find((post) => post.service === 'yt');

  const [showEditingDialog, setShowEditingDialog] = createSignal(false);
  const [showLocationDialog, setShowLocationDialog] = createSignal(false);
  const [contentIsLoading, setContentIsLoading] = createSignal(true);
  const [showIdCopiedMessage, setShowIdCopiedMessage] = createSignal(false);

  const selectContent = (url: string) => {
    const index = content().findIndex((u) => u === url);
    setContentIsLoading(true);
    setSelectedContentIndex(index);
  };

  const copyIdToClipboard = () => {
    writeClipboard(id());
    setShowIdCopiedMessage(true);
    setTimeout(() => setShowIdCopiedMessage(false), 2000);
  };

  const handleContentLoad = () => setContentIsLoading(false);

  // TODO: display post trash

  return (
    <Page
      title={title()}
      status={
        showIdCopiedMessage()
          ? 'Copied post ID to clipboard'
          : contentIsLoading() || post.loading
            ? 'Loading...'
            : undefined
      }
    >
      <Divider class={styles.divider} />
      <Show when={post()}>
        {(post) => (
          <section
            class={clsx(
              styles.container,
              content().length > 1 && styles.withContentSelection,
              (contentPublicUrls().find((url) => typeof url === 'string') || youtubePost()) &&
                styles.withFullSizeContent,
              post().posts && styles.published,
              styles[post().type],
            )}
          >
            <Show when={content().length > 1}>
              <Frame component="section" variant="thin" class={styles.contentSelector}>
                <For each={content()}>
                  {(url) => (
                    <label class={styles.contentSelectorItem}>
                      <input
                        type="radio"
                        value={url}
                        name="selectedContent"
                        checked={selectedContent() === url}
                        onChange={() => selectContent(url)}
                        class={styles.contentSelectorRadio}
                      />
                      <ResourcePreview url={url} showTooltip />
                    </label>
                  )}
                </For>
              </Frame>
            </Show>

            <Show when={selectedContent()}>
              {(url) => (
                <Switch fallback={<ResourcePreview url={url()} onLoad={handleContentLoad} showTooltip />}>
                  <Match when={resourceIsVideo(url()) && youtubePost()}>
                    <iframe
                      width={804}
                      src={youtube.getServicePostUrl(youtubePost()!, true)}
                      title=""
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                      // @ts-expect-error No proper typing
                      frameborder="0"
                      class={clsx(frameStyles.thin, styles.content, styles.youtubeVideo)}
                      onLoad={handleContentLoad}
                    />
                  </Match>
                  <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                    <img
                      src={selectedContentPublicUrl()}
                      class={clsx(frameStyles.thin, styles.content, styles.image)}
                      onLoad={handleContentLoad}
                    />
                  </Match>
                </Switch>
              )}
            </Show>

            <Frame component="section" variant="thin" class={styles.main}>
              <div class={styles.info}>
                <section class={styles.titles}>
                  <h1 class={styles.title}>{title()}</h1>
                  <p class={styles.titleRu}>{titleRu()}</p>
                </section>

                <Show when={post().description || post().descriptionRu}>
                  <section class={styles.descriptions}>
                    <Show when={post().description}>
                      <p class={styles.description}>{post().description}</p>
                    </Show>
                    <Show when={post().descriptionRu}>
                      <p class={styles.description}>{post().descriptionRu}</p>
                    </Show>
                  </section>
                </Show>
              </div>

              <Divider />

              <Table
                rows={[
                  {
                    label: 'Location',
                    value: (
                      <Button class={styles.location} onClick={() => setShowLocationDialog(true)}>
                        {post().location || 'Locate'}
                      </Button>
                    ),
                  },
                  { label: 'Type', value: post().type },
                  {
                    label: 'Author',
                    value: authors()?.map(getUserEntryTitle).join(', '),
                  },
                  { label: 'Engine', value: post().engine },
                  { label: 'Addon', value: post().addon },
                  { label: "Editor's Mark", value: post().mark },
                  { label: 'Violation', value: post().violation },
                ]}
              />

              <Show when={post().tags?.length}>
                <Divider />

                <Table label="Tags" rows={post().tags?.map((label) => ({ label, value: <></> })) ?? []}></Table>
              </Show>

              <div class={styles.id}>
                <Input value={id()} readonly />
                <Button class={styles.copy} onClick={copyIdToClipboard}>
                  Copy
                </Button>
              </div>

              <div class={styles.spacer} />

              <div class={styles.footer}>
                <div class={styles.spacer} />
                <Button onClick={() => setShowEditingDialog(true)} class={styles.edit}>
                  Edit
                </Button>
              </div>
            </Frame>

            <Show when={post().posts}>
              <PostComments post={post()} class={styles.comments} />
            </Show>

            <Show when={post().posts}>
              <PostPublications post={post()} class={styles.publications} />
            </Show>

            <PostEditingDialog
              postEntry={[id(), post()]}
              show={showEditingDialog()}
              onClose={() => setShowEditingDialog(false)}
            />

            <PostLocationDialog
              postEntry={[id(), post()]}
              show={showLocationDialog()}
              onClose={() => setShowLocationDialog(false)}
            />
          </section>
        )}
      </Show>
    </Page>
  );
};

import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import { type Component, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { getPostDateById, getPostTypeAspectRatio, type Post } from '../../../core/entities/post.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import type { UserEntry } from '../../../core/entities/user.js';
import { getUserEntryTitle } from '../../../core/entities/user.js';
import { youtube } from '../../../core/services/youtube.js';
import { store } from '../../../core/stores/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { useParams } from '../../hooks/useParams.js';
import { postRoute, type PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import frameStyles from '../Frame/Frame.module.css';
import { Input } from '../Input/Input.js';
import { PostComments } from '../PostComments/PostComments.js';
import { PostEditingDialog } from '../PostEditingDialog/PostEditingDialog.js';
import { PostLocationDialog } from '../PostLocationDialog/PostLocationDialog.js';
import { PostPublications } from '../PostPublications/PostPublications.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { Table } from '../Table/Table.js';
import { Toast, useToaster } from '../Toaster/Toaster.js';
import styles from './PostPage.module.css';

export interface PostPageData {
  post: Post | undefined;
  refId: string | undefined;
  authorEntries: UserEntry[];
}

export const PostPage: Component = () => {
  const { addToast } = useToaster();
  const params = useParams<PostRouteParams>();
  let imageRef: HTMLImageElement | undefined;

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);

  const id = () => params().id;
  const data = useData<PostPageData>();

  const date = () => getPostDateById(id());
  const refDate = () => (data.refId ? getPostDateById(data.refId) : undefined);

  const title = () => data.post?.title || 'Untitled';
  const titleRu = () => data.post?.titleRu || 'Без названия';
  const content = () => asArray(data.post?.content);
  const contentPublicUrls = () => content().map((url) => store.getPublicUrl(parseResourceUrl(url).pathname));
  const locationButtonTitle = () => data.post?.location || 'Locate';
  const aspectRatio = () => (data.post ? getPostTypeAspectRatio(data.post.type) : '1/1');

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => data.post?.posts?.find((post) => post.service === 'yt');

  const [showEditingDialog, setShowEditingDialog] = createSignal(false);
  const [showLocationDialog, setShowLocationDialog] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  const selectContent = (url: string) => {
    const index = content().findIndex((u) => u === url);
    setSelectedContentIndex(index);
  };

  const copyIdToClipboard = () => {
    writeClipboard(id());
    addToast('Post ID copied to clipboard');
  };

  const handleContentLoad = () => setIsLoading(false);

  onMount(() => {
    // Check if image is already loaded
    setIsLoading(!imageRef?.complete);
  });

  // TODO: display post trash

  return (
    <>
      <Toast message="Loading..." show={isLoading()} />
      <Divider class={styles.divider} />
      <Show when={data.post}>
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
                      <ResourcePreview url={url} aspectRatio={aspectRatio()} showTooltip />
                    </label>
                  )}
                </For>
              </Frame>
            </Show>

            <Show when={selectedContent()}>
              {(url) => (
                <Switch
                  fallback={
                    <ResourcePreview url={url()} aspectRatio={aspectRatio()} onLoad={handleContentLoad} showTooltip />
                  }
                >
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
                      style={{ 'aspect-ratio': aspectRatio() }}
                    />
                  </Match>
                  <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                    <img
                      src={selectedContentPublicUrl()}
                      class={clsx(frameStyles.thin, styles.content, styles.image)}
                      onLoad={handleContentLoad}
                      style={{ 'aspect-ratio': aspectRatio() }}
                      ref={imageRef}
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
                    value: () => (
                      <Button class={styles.location} onClick={() => setShowLocationDialog(true)}>
                        {locationButtonTitle()}
                      </Button>
                    ),
                  },
                  { label: 'Date', value: date() },
                  {
                    label: 'Original Post Date',
                    value: refDate(),
                    link: data.refId
                      ? postRoute.createUrl({ managerName: params().managerName, id: data.refId })
                      : undefined,
                  },
                  { label: 'Type', value: post().type },
                  {
                    label: 'Author',
                    value: data.authorEntries.map(getUserEntryTitle).join(', '),
                  },
                  { label: 'Engine', value: post().engine },
                  { label: 'Addon', value: post().addon },
                  { label: "Editor's Mark", value: post().mark },
                  { label: 'Violation', value: post().violation },
                ]}
              />

              <Show when={post().tags?.length}>
                <Divider />

                <Table label="Tags" rows={post().tags?.map((label) => ({ label, value: () => <></> })) ?? []}></Table>
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
    </>
  );
};

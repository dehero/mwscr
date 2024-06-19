import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import { type Component, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import { useData } from 'vike-solid/useData';
import YellowExclamationMark from '../../../../assets/images/exclamation.svg';
import { getPostDateById, getPostTypeAspectRatio, type Post, POST_VIOLATIONS } from '../../../core/entities/post.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import type { UserEntry } from '../../../core/entities/user.js';
import { getUserEntryLetter, getUserEntryTitle } from '../../../core/entities/user.js';
import { youtube } from '../../../core/services/youtube.js';
import { store } from '../../../core/stores/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { useParams } from '../../hooks/useParams.js';
import { postRoute, type PostRouteParams } from '../../routes/post-route.js';
import { userRoute } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import frameStyles from '../Frame/Frame.module.css';
import { GoldIcon } from '../GoldIcon/GoldIcon.jsx';
import { Icon } from '../Icon/Icon.jsx';
import { Input } from '../Input/Input.js';
import { PostComments } from '../PostComments/PostComments.js';
import { PostEditingDialog } from '../PostEditingDialog/PostEditingDialog.js';
import { PostLocationDialog } from '../PostLocationDialog/PostLocationDialog.js';
import { PostPublications } from '../PostPublications/PostPublications.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { ResourcePreviews } from '../ResourcePreviews/ResourcePreviews.jsx';
import { Table } from '../Table/Table.js';
import { Toast, useToaster } from '../Toaster/Toaster.js';
import styles from './PostPage.module.css';

export interface PostPageData {
  post: Post | undefined;
  refId: string | undefined;
  authorEntries: UserEntry[];
  requesterEntry: UserEntry | undefined;
}

export const PostPage: Component = () => {
  const { addToast } = useToaster();
  const params = useParams<PostRouteParams>();
  let fallbackImageRef: HTMLImageElement | undefined;

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
  const alt = () => data.post?.tags?.join(' ');

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => data.post?.posts?.find((post) => post.service === 'yt');

  const published = () => Boolean(data.post?.posts);
  const withFullSizeContent = () =>
    Boolean(published() || contentPublicUrls().find((url) => typeof url === 'string') || youtubePost());
  const withContentSelection = () => withFullSizeContent() && content().length > 1;

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

  const handleContentError = () => {
    setIsLoading(false);
  };

  const handleContentDownload = async (e: Event) => {
    e.preventDefault();

    const href = selectedContentPublicUrl();
    if (href) {
      const downloader = new JsFileDownloader({ url: href, autoStart: false, nativeFallbackOnError: true });
      try {
        await downloader.start();
      } catch (error) {
        const message = error instanceof Error ? error.message : error ? error.toString() : 'Failed to download';
        addToast(message);
      }
    }
  };

  onMount(() => {
    // Check if image is already loaded
    if (fallbackImageRef) {
      setIsLoading(!fallbackImageRef.complete);
    }
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
              published() && styles.published,
              withContentSelection() && styles.withContentSelection,
              withFullSizeContent() && styles.withFullSizeContent,
              styles[post().type],
            )}
          >
            <Show
              when={withFullSizeContent()}
              fallback={
                <ResourcePreviews
                  urls={content()}
                  showTooltip
                  onLoad={handleContentLoad}
                  class={clsx(frameStyles.thin, styles.contentPreviews)}
                />
              }
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
                      <ResourcePreview
                        url={url()}
                        aspectRatio={aspectRatio()}
                        onLoad={handleContentLoad}
                        showTooltip
                        class={styles.selectedContent}
                        alt={alt() || url()}
                      />
                    }
                  >
                    <Match when={resourceIsVideo(url()) && youtubePost()}>
                      <iframe
                        width={804}
                        src={youtube.getServicePostUrl(youtubePost()!, true)}
                        title={alt() || url()}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        // @ts-expect-error No proper typing
                        frameborder="0"
                        class={clsx(frameStyles.thin, styles.selectedContent, styles.youtubeVideo)}
                        onLoad={handleContentLoad}
                        style={{ 'aspect-ratio': aspectRatio() }}
                      />
                    </Match>
                    <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                      <object
                        data={selectedContentPublicUrl()}
                        class={clsx(
                          frameStyles.thin,
                          styles.selectedContent,
                          styles.image,
                          isLoading() && styles.loading,
                        )}
                        onLoad={handleContentLoad}
                        onError={handleContentError}
                        style={{ 'aspect-ratio': aspectRatio() }}
                        aria-label={alt() || url()}
                      >
                        <img
                          src={YellowExclamationMark}
                          class={styles.image}
                          ref={fallbackImageRef}
                          alt="yellow exclamation mark"
                        />
                      </object>

                      <div class={styles.downloadButtonWrapper}>
                        <Button
                          href={selectedContentPublicUrl()}
                          onClick={handleContentDownload}
                          class={styles.downloadButton}
                          target="_blank"
                        >
                          Download
                        </Button>
                      </div>
                    </Match>
                  </Switch>
                )}
              </Show>
            </Show>

            <Frame component="section" variant="thin" class={styles.main}>
              <div class={styles.info}>
                <section class={styles.titles}>
                  <p class={styles.title}>{title()}</p>
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

              <Show when={post().posts}>
                <span class={styles.publishedIcon}>
                  <GoldIcon class={styles.icon} />
                  Published
                </span>
              </Show>

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
                  ...data.authorEntries.map((entry) => ({
                    label: 'Author',
                    value: () => (
                      <>
                        <Icon color="stealth" size="small" variant="flat" class={clsx(styles.icon, styles.tableIcon)}>
                          {getUserEntryLetter(entry)}
                        </Icon>
                        {getUserEntryTitle(entry)}
                      </>
                    ),
                    link: userRoute.createUrl({ id: entry[0] }),
                  })),
                  {
                    label: 'Requester',
                    value: data.requesterEntry
                      ? () => (
                          <>
                            <Icon color="magic" size="small" variant="flat" class={clsx(styles.icon, styles.tableIcon)}>
                              {getUserEntryLetter(data.requesterEntry!)}
                            </Icon>
                            {getUserEntryTitle(data.requesterEntry!)}
                          </>
                        )
                      : undefined,
                    link: data.requesterEntry ? userRoute.createUrl({ id: data.requesterEntry[0] }) : undefined,
                  },
                  { label: 'Engine', value: post().engine },
                  { label: 'Addon', value: post().addon },
                  {
                    label: "Editor's Mark",
                    value: post().mark
                      ? () => (
                          <>
                            <Icon
                              color="combat"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {post().mark?.[0]}
                            </Icon>
                            {post().mark?.[1]}
                          </>
                        )
                      : undefined,
                  },
                  {
                    label: 'Violation',
                    value: post().violation
                      ? () => (
                          <>
                            <Icon
                              color="health"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {POST_VIOLATIONS[post().violation!].letter}
                            </Icon>
                            {POST_VIOLATIONS[post().violation!].title}
                          </>
                        )
                      : undefined,
                  },
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

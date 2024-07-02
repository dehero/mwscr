import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import { type Component, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { getPostDateById, getPostTypeAspectRatio, type Post, POST_VIOLATIONS } from '../../../core/entities/post.js';
import {
  getPostCommentCount,
  getPostRating,
  getPostTotalLikes,
  getPostTotalViews,
} from '../../../core/entities/post.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import type { UserEntry } from '../../../core/entities/user.js';
import { getUserEntryLetter, getUserEntryTitle } from '../../../core/entities/user.js';
import { youtube } from '../../../core/services/youtube.js';
import { store } from '../../../core/stores/index.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { isValidDate } from '../../../core/utils/date-utils.js';
import { useParams } from '../../hooks/useParams.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { postRoute, type PostRouteParams } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import frameStyles from '../Frame/Frame.module.css';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Input } from '../Input/Input.js';
import { PostComments } from '../PostComments/PostComments.js';
import { PostEditingDialog } from '../PostEditingDialog/PostEditingDialog.js';
import { PostLocationDialog } from '../PostLocationDialog/PostLocationDialog.js';
import { PostPublications } from '../PostPublications/PostPublications.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { ResourcePreviews } from '../ResourcePreviews/ResourcePreviews.js';
import { ResourceSelector } from '../ResourceSelector/ResourceSelector.js';
import { Spacer } from '../Spacer/Spacer.js';
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
  let selectedContentRef: HTMLObjectElement | undefined;

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);

  const id = () => params().id;
  const data = useData<PostPageData>();

  const date = () => getPostDateById(id());
  const refDate = () => (data.refId ? getPostDateById(data.refId) : undefined);

  const title = () => data.post?.title || 'Untitled';
  const titleRu = () => data.post?.titleRu || 'Без названия';
  const content = () => asArray(data.post?.content);
  const contentPublicUrls = () => content().map((url) => store.getPublicUrl(parseResourceUrl(url).pathname));
  const aspectRatio = () => (data.post ? getPostTypeAspectRatio(data.post.type) : '1/1');
  const alt = () => data.post?.tags?.join(' ');

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => data.post?.posts?.find((post) => post.service === 'yt');
  const youtubeUrl = () => (youtubePost() ? youtube.getServicePostUrl(youtubePost()!, true) : undefined);

  const published = () => Boolean(data.post?.posts);
  const withContent = () => content().length > 0;
  const withFullSizeContent = () =>
    Boolean(published() || contentPublicUrls().find((url) => typeof url === 'string') || youtubePost());
  const withContentSelection = () => withFullSizeContent() && content().length > 1;
  const withRequest = () => Boolean(data.post?.request);

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

  const handleContentLoad = () => {
    setIsLoading(false);
  };

  const handleContentError = (url: string) => {
    addToast(`Failed to load content: ${url}`);
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
    const data = selectedContentPublicUrl();
    if (selectedContentRef && data) {
      // Force trigger onLoad event after hydration by changing data
      selectedContentRef.data = data;
    }
  });

  // TODO: display post trash

  return (
    <Frame
      class={clsx(
        styles.container,
        published() && styles.published,
        withContent() && styles.withContent,
        withContentSelection() && styles.withContentSelection,
        withFullSizeContent() && styles.withFullSizeContent,
        withRequest() && styles.withRequest,
        data.post?.type && styles[data.post.type],
      )}
    >
      <Toast message="Loading Content" show={content().length > 0 && isLoading()} loading />
      <Show when={data.post}>
        {(post) => (
          <>
            <Show when={withContent()}>
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
                  <ResourceSelector
                    urls={content()}
                    aspectRatio={aspectRatio()}
                    onSelect={selectContent}
                    selected={selectedContent()}
                    class={styles.contentSelector}
                  />
                </Show>

                <Show when={selectedContent()}>
                  {(url) => (
                    <section class={styles.selectedContentWrapper}>
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
                        <Match when={resourceIsVideo(url()) && youtubeUrl()}>
                          <iframe
                            width={804}
                            src={youtubeUrl()}
                            title={alt() || url()}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                            // @ts-expect-error No proper typing
                            frameborder="0"
                            class={clsx(frameStyles.thin, styles.selectedContent, styles.youtubeVideo)}
                            onLoad={handleContentLoad}
                            onError={() => handleContentError(youtubeUrl()!)}
                            style={{ 'aspect-ratio': aspectRatio() }}
                          />
                        </Match>
                        <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                          <object
                            ref={selectedContentRef}
                            data={selectedContentPublicUrl()}
                            class={clsx(frameStyles.thin, styles.selectedContent, styles.image)}
                            onLoad={handleContentLoad}
                            onError={() => handleContentError(selectedContentPublicUrl()!)}
                            style={{ 'aspect-ratio': aspectRatio() }}
                            aria-label={alt() || url()}
                          >
                            <img src={YellowExclamationMark} class={styles.image} alt="yellow exclamation mark" />
                          </object>

                          <Button
                            href={selectedContentPublicUrl()}
                            onClick={handleContentDownload}
                            class={styles.downloadButton}
                            target="_blank"
                          >
                            Download
                          </Button>
                        </Match>
                      </Switch>
                    </section>
                  )}
                </Show>
              </Show>
            </Show>

            <Show when={post().request}>
              {(request) => (
                <Frame variant="thin" class={styles.request}>
                  <p class={styles.requestText}>{request().text}</p>

                  <Show when={data.requesterEntry}>
                    {(entry) => (
                      <p class={styles.requestUser}>
                        {getUserEntryTitle(entry())}, {post().request?.date.toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </Show>
                </Frame>
              )}
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
                    value: !post().location
                      ? () => (
                          <Button class={styles.location} onClick={() => setShowLocationDialog(true)}>
                            Locate
                          </Button>
                        )
                      : post().location,
                    link: post().location
                      ? postsRoute.createUrl({ managerName: 'published', location: post().location, original: 'true' })
                      : undefined,
                  },
                  { label: 'Date', value: isValidDate(date()) ? date() : undefined },
                  {
                    label: 'Original Post Date',
                    value: isValidDate(refDate()) ? refDate() : undefined,
                    link: data.refId
                      ? postRoute.createUrl({ managerName: params().managerName, id: data.refId })
                      : undefined,
                  },
                  {
                    label: 'Type',
                    value: post().type,
                    link: postsRoute.createUrl({ managerName: params().managerName, type: post().type }),
                  },
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
                    link: post().mark
                      ? postsRoute.createUrl({ managerName: 'published', mark: post().mark, original: 'true' })
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
                    link: post().violation
                      ? postsRoute.createUrl({ managerName: 'trash', violation: post().violation })
                      : undefined,
                  },
                ]}
              />

              <Show when={post().tags?.length}>
                <Divider />

                <Table label="Tags" rows={post().tags?.map((label) => ({ label, value: () => <></> })) ?? []}></Table>
              </Show>

              <Show when={post().posts}>
                <Divider />

                <Table
                  class={styles.table}
                  label="Reactions"
                  rows={[
                    {
                      label: 'Likes',
                      value: getPostTotalLikes(post()),
                    },
                    {
                      label: 'Views',
                      value: getPostTotalViews(post()),
                    },
                    {
                      label: 'Rating',
                      value: Number(getPostRating(post()).toFixed(2)),
                    },
                    {
                      label: 'Comments',
                      value: getPostCommentCount(post()),
                    },
                  ]}
                />
              </Show>

              <Spacer />

              <div class={styles.footer}>
                <div class={styles.id}>
                  <Input value={id()} readonly />
                  <Button class={styles.copy} onClick={copyIdToClipboard}>
                    Copy
                  </Button>
                </div>
                {/* <Button onClick={() => setShowEditingDialog(true)} class={styles.edit}>
                  Edit
                </Button> */}
              </div>
            </Frame>

            <Show when={published()}>
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
          </>
        )}
      </Show>
    </Frame>
  );
};

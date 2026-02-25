import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import type { JSX } from 'solid-js';
import { createEffect, createMemo, createResource, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import { getPostDateById, postTypeDescriptors, postViolationDescriptors } from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import { getPublicationsStats } from '../../../core/entities/publication.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import { store } from '../../../core/stores/index.js';
import { asArray, capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { getVideoLightweightUrl, getVideoPosterUrl } from '../../data-managers/resources.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { postRoute } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { Button } from '../Button/Button.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { GoldIcon } from '../GoldIcon/GoldIcon.js';
import { Icon } from '../Icon/Icon.js';
import { Input } from '../Input/Input.js';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.js';
import { Markdown } from '../Markdown/Markdown.jsx';
import { PostComments } from '../PostComments/PostComments.js';
import { PostPublications } from '../PostPublications/PostPublications.js';
import { PostTypeGlyph } from '../PostTypeGlyph/PostTypeGlyph.jsx';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { ResourcePreviews } from '../ResourcePreviews/ResourcePreviews.js';
import { ResourceSelector } from '../ResourceSelector/ResourceSelector.js';
import { Spacer } from '../Spacer/Spacer.js';
import type { TableRow } from '../Table/Table.js';
import { Table } from '../Table/Table.js';
import { Toast, useToaster } from '../Toaster/Toaster.js';
import { UserAvatar } from '../UserAvatar/UserAvatar.jsx';
import { UserTooltip } from '../UserTooltip/UserTooltip.js';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer.jsx';
import { WorldMap } from '../WorldMap/WorldMap.js';
import styles from './PostPage.module.css';

interface ContentInfo {
  url: string;
  publicUrl?: string;
  scrollable: boolean;
}

export interface PostPageSearchParams {
  repostId?: string;
}

export const PostPage = (): JSX.Element => {
  const { addToast, messageBox } = useToaster();
  const pageContext = usePageContext();
  const { data, params, loading } = useRouteInfo(pageContext, postRoute);
  let selectedContentRef: HTMLImageElement | undefined;

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);
  const [loadingFailedUrls, setLoadingFailedUrls] = createSignal<string[]>([]);

  const [searchParams, setSearchParams] = useSearchParams<PostPageSearchParams>();
  const repostId = () => searchParams().repostId;
  const setRepostId = (repostId: string | undefined) =>
    setSearchParams({ repostId: repostId !== params().id ? repostId : undefined });

  const [postInfo, { refetch }] = createResource(params, ({ managerName, id }) =>
    dataManager.getPostInfo(managerName, id),
  );

  createEffect(() => {
    if (postInfo()?.refId) {
      // @ts-expect-error No proper typing
      navigate(
        postRoute.createUrl({ managerName: params().managerName, id: postInfo()!.refId!, repostId: postInfo()!.id }),
        { overwriteLastHistoryEntry: true },
      );
    }
  });

  useLocalPatch(refetch);

  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[params().managerName].actions);

  const date = () => getPostDateById(params().id);

  const title = () => postInfo()?.title || 'Untitled';
  const titleRu = () => postInfo()?.titleRu || 'Без названия';
  const contentInfos = (): ContentInfo[] => [
    ...asArray(postInfo()?.content).map((url) => ({
      url,
      publicUrl: store.getPublicUrl(parseResourceUrl(url).pathname),
      scrollable: false,
    })),
    ...asArray(postInfo()?.snapshot).map((url) => ({
      url,
      publicUrl: store.getPublicUrl(parseResourceUrl(url).pathname),
      scrollable: true,
    })),
  ];
  const aspectRatio = () => (postInfo() ? postInfo()!.aspect : '1/1');
  const alt = () => postInfo()?.tags?.join(' ');

  const selectedContentInfo = () => contentInfos()[selectedContentIndex()];

  const stats = () => getPublicationsStats(data().publications ?? []);

  const withContent = () => contentInfos().length > 0;
  const withFullSizeContent = () =>
    Boolean(postInfo()?.published || contentInfos().find(({ publicUrl }) => typeof publicUrl === 'string'));
  const withContentSelection = () => withFullSizeContent() && contentInfos().length > 1;
  const withRequest = () => Boolean(postInfo()?.request);

  const [isLoading, setIsLoading] = createSignal(true);

  const selectContent = (url: string) => {
    const index = contentInfos().findIndex((info) => info.url === url);
    setIsLoading(true);
    setSelectedContentIndex(index);
  };

  const copyPathToClipboard = () => {
    writeClipboard(createPostPath(params().managerName, params().id));
    addToast('Post path copied to clipboard');
  };

  const handleContentLoad = () => {
    setIsLoading(false);
  };

  const handleContentError = (url: string) => {
    addToast(`Failed to load content: ${url}`);
    setLoadingFailedUrls([...loadingFailedUrls(), url]);
    setIsLoading(false);
  };

  const handleContentDownload = async (e: Event) => {
    e.preventDefault();

    const href = selectedContentInfo()?.publicUrl;
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

  const handleReset = async () => {
    const result = await messageBox('Are you sure you want to reset current local changes for this post?', [
      'Yes',
      'No',
    ]);
    if (result === 0) {
      const targetId = postInfo()?.refId || params().id;
      dataManager.findPostsManager(params().managerName)?.resetItemPatch(targetId);
    }
  };

  onMount(() => {
    const src = selectedContentInfo()?.publicUrl;
    if (selectedContentRef && src) {
      // Force trigger onLoad event after hydration by changing src
      selectedContentRef.src = src;
    }
  });

  // TODO: display post trash

  return (
    <Frame
      class={clsx(
        styles.container,
        postInfo()?.published && styles.published,
        withContent() && styles.withContent,
        withContentSelection() && styles.withContentSelection,
        withFullSizeContent() && styles.withFullSizeContent,
        withRequest() && styles.withRequest,
        postInfo()?.type && styles[postInfo()!.type],
      )}
    >
      <Toast message="Loading Page" show={loading() || postInfo.loading} loading />
      <Toast message="Loading Content" show={contentInfos().length > 0 && isLoading()} loading />
      <Show when={postInfo()}>
        {(postInfo) => (
          <>
            <Show when={withContent()}>
              <Show
                when={withFullSizeContent()}
                fallback={
                  <ResourcePreviews
                    urls={contentInfos().map(({ url }) => url)}
                    showTooltip
                    onLoad={handleContentLoad}
                    class={styles.contentPreviews}
                  />
                }
              >
                <Show when={contentInfos().length > 1}>
                  <ResourceSelector
                    urls={contentInfos().map(({ url }) => url)}
                    aspectRatio={aspectRatio() ?? '1 / 1'}
                    onSelect={selectContent}
                    selected={selectedContentInfo()!.url}
                    class={styles.contentSelector}
                  />
                </Show>

                <Show when={selectedContentInfo()}>
                  {(info) => (
                    <section class={styles.selectedContentWrapper}>
                      <Switch
                        fallback={
                          <ResourcePreview
                            url={info().url}
                            aspectRatio={aspectRatio()}
                            onLoad={handleContentLoad}
                            showTooltip
                            class={styles.selectedContent}
                            alt={alt() || info().url}
                          />
                        }
                      >
                        <Match when={info().publicUrl && loadingFailedUrls().includes(info().publicUrl!)}>
                          <Frame
                            component="img"
                            src={YellowExclamationMark}
                            class={clsx(styles.selectedContent, styles.image)}
                            style={{ 'aspect-ratio': aspectRatio() }}
                            aria-label="yellow exclamation mark"
                          />
                        </Match>
                        <Match when={resourceIsVideo(info().url) && info().publicUrl}>
                          <VideoPlayer
                            title={alt() || info().url}
                            src={getVideoLightweightUrl(info().publicUrl!)}
                            poster={getVideoPosterUrl(info().publicUrl!)}
                            aspectRatio={aspectRatio()}
                            onLoad={handleContentLoad}
                            onError={() => handleContentError(getVideoLightweightUrl(info().publicUrl!))}
                            class={styles.selectedContent}
                          />
                        </Match>
                        <Match when={resourceIsImage(info().url) && info().publicUrl}>
                          <Show
                            when={!info().scrollable}
                            fallback={
                              <Frame class={styles.selectedContentScrollable}>
                                <img
                                  class={styles.scrollableImage}
                                  ref={selectedContentRef}
                                  src={info().publicUrl!}
                                  onLoad={handleContentLoad}
                                  onError={() => handleContentError(info().publicUrl!)}
                                  aria-label={alt() || info().url}
                                />
                              </Frame>
                            }
                          >
                            <Frame
                              component="img"
                              ref={selectedContentRef}
                              src={info().publicUrl!}
                              class={clsx(styles.selectedContent, styles.image)}
                              onLoad={handleContentLoad}
                              onError={() => handleContentError(info().publicUrl!)}
                              style={{
                                'aspect-ratio': aspectRatio(),
                                'object-fit': aspectRatio() ? 'cover' : 'contain',
                              }}
                              aria-label={alt() || info().url}
                            />

                            <Button
                              href={info().publicUrl}
                              onClick={handleContentDownload}
                              class={styles.downloadButton}
                              target="_blank"
                            >
                              Download
                            </Button>
                          </Show>
                        </Match>
                      </Switch>
                    </section>
                  )}
                </Show>
              </Show>
            </Show>

            <Show when={postInfo().request}>
              {(request) => (
                <Frame variant="thin" class={styles.request}>
                  <p class={styles.requestText}>{request().text}</p>

                  <Show when={postInfo().requesterOption}>
                    {(option) => (
                      <p class={styles.requestUser}>
                        {option().label}, {formatDate(request().date)}
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

                <Show
                  when={
                    postActions().some((action) => ['edit', 'precise', 'merge', 'order'].includes(action)) ||
                    (!postInfo().location && postActions().includes('locate')) ||
                    postInfo().status
                  }
                >
                  <div class={styles.actions}>
                    <Show
                      when={
                        postInfo().status !== 'removed' &&
                        postActions().includes('order') &&
                        postInfo().type === 'merch'
                      }
                    >
                      <Button
                        href={createDetachedDialogFragment(
                          'merch-ordering',
                          createPostPath(params().managerName, params().id),
                        )}
                        class={styles.action}
                      >
                        Order
                      </Button>
                    </Show>

                    <Show when={postInfo().status !== 'removed' && postActions().includes('edit')}>
                      <Button
                        href={createDetachedDialogFragment(
                          'post-editing',
                          createPostPath(params().managerName, params().id),
                        )}
                        class={styles.action}
                      >
                        Edit
                      </Button>
                    </Show>

                    <Show when={postInfo().status !== 'removed' && postActions().includes('precise')}>
                      <Button
                        href={createDetachedDialogFragment(
                          'post-precising',
                          createPostPath(params().managerName, params().id),
                        )}
                        class={styles.action}
                      >
                        Precise
                      </Button>
                    </Show>

                    <Show
                      when={postInfo().status !== 'removed' && !postInfo().location && postActions().includes('locate')}
                    >
                      <Button
                        class={styles.action}
                        href={createDetachedDialogFragment(
                          'post-location',
                          createPostPath(params().managerName, params().id),
                        )}
                      >
                        Locate
                      </Button>
                    </Show>

                    <Show when={postInfo().status}>
                      <Button class={styles.action} onClick={handleReset}>
                        {postInfo().status === 'added' ? 'Remove' : 'Restore'}
                      </Button>
                    </Show>
                  </div>
                </Show>

                <Show when={postInfo().description || postInfo().descriptionRu}>
                  <section class={styles.descriptions}>
                    <Show when={postInfo().description}>
                      <Markdown>{postInfo().description!}</Markdown>
                    </Show>
                    <Show when={postInfo().descriptionRu}>
                      <Markdown>{postInfo().descriptionRu!}</Markdown>
                    </Show>
                  </section>
                </Show>
              </div>

              <Show when={postInfo().published}>
                <span class={styles.publishedIcon}>
                  <GoldIcon class={styles.icon} />
                  Published
                </span>
              </Show>

              <Show when={isValidDate(date())}>
                <span class={styles.date}>{formatDate(date()!)}</span>
              </Show>

              <Show when={postInfo().status}>
                {(status) => (
                  <span class={styles.status}>
                    <Icon color="attribute" size="small" variant="flat">
                      {capitalizeFirstLetter(status())[0]}
                    </Icon>{' '}
                    {capitalizeFirstLetter(status())}
                  </span>
                )}
              </Show>

              <Divider />

              <Table
                rows={[
                  { label: 'Created', value: postInfo().created },
                  {
                    label: 'Type',
                    value: () => (
                      <>
                        <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                          <PostTypeGlyph type={postInfo().type} />
                        </Icon>
                        {postTypeDescriptors[postInfo().type].title}
                      </>
                    ),
                    link: postsRoute.createUrl({ managerName: params().managerName, type: postInfo().type }),
                  },
                  ...postInfo().authorOptions.map(
                    (option): TableRow => ({
                      label: 'Author',
                      value: () => (
                        <>
                          <UserAvatar
                            image={option.image}
                            title={option.label ?? option.value ?? '?'}
                            size="small"
                            class={styles.avatar}
                          />
                          {option.label}
                        </>
                      ),
                      link: userRoute.createUrl({ id: option.value ?? '' }),
                      tooltip: (ref) => <UserTooltip forRef={ref} user={option.value} showAvatar />,
                    }),
                  ),
                  {
                    label: 'Located By',
                    value: postInfo().locatorOption
                      ? () => (
                          <>
                            <UserAvatar
                              image={postInfo().locatorOption!.image}
                              title={postInfo().locatorOption!.label ?? postInfo().locatorOption!.value ?? '?'}
                              size="small"
                              class={styles.avatar}
                            />
                            {postInfo().locatorOption!.label}
                          </>
                        )
                      : undefined,
                    link: postInfo().locatorOption
                      ? userRoute.createUrl({ id: postInfo().locatorOption!.value ?? '' })
                      : undefined,
                    tooltip: (ref) => <UserTooltip forRef={ref} user={postInfo().locatorOption!.value} showAvatar />,
                  },
                  {
                    label: 'Requested By',
                    value: postInfo().requesterOption
                      ? () => (
                          <>
                            <UserAvatar
                              image={postInfo().requesterOption!.image}
                              title={postInfo().requesterOption!.label ?? postInfo().requesterOption!.value ?? '?'}
                              size="small"
                              class={styles.avatar}
                            />
                            {postInfo().requesterOption!.label}
                          </>
                        )
                      : undefined,
                    link: postInfo().requesterOption
                      ? userRoute.createUrl({ id: postInfo().requesterOption!.value ?? '' })
                      : undefined,
                    tooltip: (ref) => <UserTooltip forRef={ref} user={postInfo().requesterOption!.value} showAvatar />,
                  },
                  {
                    label: 'Placement',
                    value: postInfo().placement,
                    link: postsRoute.createUrl({ managerName: params().managerName, placement: postInfo().placement }),
                  },
                  { label: 'Engine', value: postInfo().engine },
                  {
                    label: 'Addon',
                    value: postInfo().addon,
                    link: postsRoute.createUrl({ managerName: params().managerName, addon: postInfo().addon }),
                  },
                  {
                    label: "Editor's Mark",
                    value: postInfo().mark
                      ? () => (
                          <>
                            <Icon
                              color="combat"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {postInfo().mark?.[0]}
                            </Icon>
                            {postInfo().mark?.[1]}
                          </>
                        )
                      : undefined,
                    link: postInfo().mark
                      ? postsRoute.createUrl({ managerName: 'posts', mark: postInfo().mark, original: 'true' })
                      : undefined,
                  },
                  ...asArray(postInfo().violation).map((violation) => ({
                    label: 'Violation',
                    value: postInfo().violation
                      ? () => (
                          <>
                            <Icon
                              color="health"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {postViolationDescriptors[violation].letter}
                            </Icon>
                            {postViolationDescriptors[violation].title}
                          </>
                        )
                      : undefined,
                    link: postInfo().violation
                      ? postsRoute.createUrl({ managerName: 'rejects', violation })
                      : undefined,
                  })),
                ]}
              />

              <Show when={data().locationInfos?.length}>
                <Divider />

                <Table
                  label="Locations"
                  rows={
                    data().locationInfos?.map((info) => ({
                      label: info.title,
                      value: info.discovered?.posts,
                      link: postsRoute.createUrl({ managerName: 'posts', location: info.title, original: 'true' }),
                      tooltip: (ref) => <LocationTooltip forRef={ref} location={info} />,
                    })) ?? []
                  }
                  showEmptyValueRows
                />
              </Show>

              <Show when={data().tagInfos?.length}>
                <Divider />

                <Table
                  label="Tags"
                  rows={
                    data().tagInfos?.map((info) => ({
                      label: info.id,
                      value: info.tagged?.posts,
                      link: postsRoute.createUrl({ managerName: 'posts', tag: info.id, original: 'true' }),
                    })) ?? []
                  }
                  showEmptyValueRows
                />
              </Show>

              <Show
                when={
                  stats().likes || stats().views || stats().commentCount || postInfo().followers || postInfo().rating
                }
              >
                <Divider />

                <Table
                  class={styles.table}
                  label="Total Reactions"
                  rows={[
                    {
                      label: 'Likes',
                      value: stats().likes,
                    },
                    {
                      label: 'Views',
                      value: stats().views,
                    },
                    {
                      label: 'Comments',
                      value: stats().commentCount,
                    },
                    {
                      label: 'Followers',
                      value: postInfo().followers,
                    },
                    {
                      label: 'Rating',
                      value: postInfo().rating,
                    },
                  ]}
                />
              </Show>

              <Show when={data().worldMapLocationInfo}>
                <Frame class={styles.mapWrapper}>
                  <WorldMap
                    class={styles.map}
                    locations={[data().worldMapLocationInfo!]}
                    currentLocation={data().worldMapLocationInfo!.title}
                    discoveredLocations={data().locationInfos?.map((info) => info.title)}
                    onSelectLocation={(location) => {
                      if (!location) {
                        return;
                      }
                      // @ts-expect-error No proper typing for navigate
                      navigate(
                        postsRoute.createUrl({
                          managerName: 'posts',
                          location,
                          original: 'true',
                        }),
                      );
                    }}
                    readonly
                  />
                </Frame>
              </Show>

              <Show when={postInfo().locating}>
                {(locating) => (
                  <div class={styles.locating}>
                    <Show when={locating().text}>
                      <p class={styles.requestText}>{locating().text}</p>
                    </Show>

                    <Show when={postInfo().locatorOption}>
                      {(option) => (
                        <p class={styles.requestUser}>
                          Located by {option().label}, {formatDate(locating().date)}
                        </p>
                      )}
                    </Show>
                  </div>
                )}
              </Show>

              <Show when={postInfo().publishableErrors}>
                {(errors) => (
                  <>
                    <Divider class={styles.divider} />
                    <section class={styles.publishableErrors}>
                      <p class={styles.publishableErrorsText}>
                        <Icon color="attribute" size="small" variant="flat">
                          !
                        </Icon>{' '}
                        {capitalizeFirstLetter(errors().join(', '))}
                      </p>
                    </section>
                  </>
                )}
              </Show>

              <Spacer />

              <div class={styles.footer}>
                <div class={styles.id}>
                  <Input value={createPostPath(params().managerName, params().id)} readonly />
                  <Button class={styles.copy} onClick={copyPathToClipboard}>
                    Copy
                  </Button>
                </div>
              </div>
            </Frame>

            <Show when={data().publications}>
              {(publications) => (
                <>
                  <PostComments publications={publications()} class={styles.comments} />

                  <PostPublications
                    postIds={[params().id, ...(data().repostIds ?? [])]}
                    selectedPostId={repostId() ?? params().id}
                    onSelectPostId={setRepostId}
                    publications={publications()}
                    class={styles.publications}
                  />
                </>
              )}
            </Show>
          </>
        )}
      </Show>
    </Frame>
  );
};

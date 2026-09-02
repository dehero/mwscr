import { writeClipboard } from '@solid-primitives/clipboard';
import type { SearchParams } from '@solidjs/router';
import { createAsync, revalidate, useNavigate, useSearchParams } from '@solidjs/router';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import { createEffect, createMemo, createResource, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { aspectRatioToReadableText } from '../../../core/entities/media.js';
import {
  getPostDateById,
  postPlacementDescriptors,
  postTypeDescriptors,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostsManagerName } from '../../../core/entities/posts-manager.js';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import { getPublicationsStats } from '../../../core/entities/publication.js';
import { resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import type { SiteRoutePage } from '../../../core/entities/site-route.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { capitalize } from '../../../core/utils/string-utils.js';
import { AppPage } from '../../components/App/App.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { GoldIcon } from '../../components/GoldIcon/GoldIcon.jsx';
import { Icon } from '../../components/Icon/Icon.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { LocationTooltip } from '../../components/LocationTooltip/LocationTooltip.jsx';
import { Markdown } from '../../components/Markdown/Markdown.jsx';
import { PostComments } from '../../components/PostComments/PostComments.jsx';
import { PostPublications } from '../../components/PostPublications/PostPublications.jsx';
import { PostTypeGlyph } from '../../components/PostTypeGlyph/PostTypeGlyph.jsx';
import { ResourcePreview } from '../../components/ResourcePreview/ResourcePreview.jsx';
import { ResourcePreviews } from '../../components/ResourcePreviews/ResourcePreviews.jsx';
import { ResourceSelector } from '../../components/ResourceSelector/ResourceSelector.jsx';
import { Spacer } from '../../components/Spacer/Spacer.jsx';
import type { TableRow } from '../../components/Table/Table.jsx';
import { Table } from '../../components/Table/Table.jsx';
import { Toast, useToaster } from '../../components/Toaster/Toaster.jsx';
import { UserAvatar } from '../../components/UserAvatar/UserAvatar.jsx';
import { UserTooltip } from '../../components/UserTooltip/UserTooltip.jsx';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer.jsx';
import { WorldMap } from '../../components/WorldMap/WorldMap.jsx';
import { dataManager } from '../../data-managers/manager.js';
import { getResourceDataUrl, getVideoLightweightUrl, getVideoPosterUrl } from '../../data-managers/resources.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import YellowExclamationMark from '../../images/exclamation.svg';
import { postRoute } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localField, localize } from '../../utils/intl-utils.js';
import type { PostPageData, PostPageParams } from './PostPage.data.js';
import { queryPostPageData } from './PostPage.data.js';
import styles from './PostPage.module.css';

interface ContentInfo {
  url: string;
  publicUrl?: string;
  scrollable: boolean;
}

export interface PostPageSearchParams extends SearchParams {
  repostId?: string;
}

export const PostPage: SiteRoutePage<PostPageParams, PostPageData> = (props) => {
  const data = createAsync(() => queryPostPageData(props.params));

  const navigate = useNavigate();

  const { addToast, messageBox } = useToaster();

  let selectedContentRef: HTMLImageElement | undefined;

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);
  const [loadingFailedUrls, setLoadingFailedUrls] = createSignal<string[]>([]);

  const [searchParams, setSearchParams] = useSearchParams<PostPageSearchParams>();
  const repostId = () => searchParams.repostId;
  const setRepostId = (repostId: string | undefined) =>
    setSearchParams({ repostId: repostId !== props.params.id ? repostId : undefined });

  const [postInfo, { refetch }] = createResource(
    (): [PostsManagerName, string] => [props.params.managerName, props.params.id],
    ([managerName, id]) => dataManager.getPostInfo(managerName, id),
  );

  createEffect(() => {
    if (postInfo()?.refId) {
      navigate(
        postRoute.createUrl({
          managerName: props.params.managerName,
          id: postInfo()!.refId!,
          repostId: postInfo()!.id,
        }),
        { replace: true },
      );
    }
  });

  useLocalPatch(() => {
    refetch();
    revalidate(queryPostPageData.key);
  });

  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[props.params.managerName].actions);

  const date = () => getPostDateById(props.params.id);

  const title = () => localField(postInfo(), 'title') || postInfo()?.id || localize(texts.content.untitled);
  const secondTitle = () => (postInfo() ? localField(postInfo()!, 'title', true) : undefined);
  const description = () => localField(postInfo(), 'description') || postInfo()?.description;
  const secondDescription = () => (postInfo() ? localField(postInfo()!, 'description', true) : undefined);
  const contentInfos = (): ContentInfo[] => [
    ...asArray(postInfo()?.content).map((url) => ({
      url,
      publicUrl: getResourceDataUrl(url),
      scrollable: false,
    })),
    ...asArray(postInfo()?.snapshot).map((url) => ({
      url,
      publicUrl: getResourceDataUrl(url),
      scrollable: true,
    })),
  ];
  const aspectRatio = () => (postInfo() ? postInfo()!.aspect : '1/1');
  const alt = () => postInfo()?.tags?.join(' ');

  const selectedContentInfo = () => contentInfos()[selectedContentIndex()];

  const stats = () => getPublicationsStats(data()?.publications ?? []);

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
    writeClipboard(createPostPath(props.params.managerName, props.params.id));
    addToast(localize(texts.content.postPathCopied));
  };

  const handleContentLoad = () => {
    setIsLoading(false);
  };

  const handleContentError = (url: string) => {
    addToast(localize(texts.content.failedToLoadContent, { url }));
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
    const result = await messageBox(localize(texts.editing.resetLocalChanges), [
      localize(texts.common.yes),
      localize(texts.common.no),
    ]);
    if (result === 0) {
      const targetId = postInfo()?.refId || props.params.id;
      dataManager.findPostsManager(props.params.managerName)?.resetItemPatch(targetId);
    }
  };

  onMount(() => {
    const src = selectedContentInfo()?.publicUrl;
    if (selectedContentRef && src) {
      // Force trigger onLoad event after hydration by changing src
      selectedContentRef.src = src;
    }

    document.dispatchEvent(new Event('pagetransitionend'));
  });

  // TODO: display post trash

  return (
    <>
      <AppPage
        title={title()}
        description={localize(texts.app.postDescription, {
          managerName: props.params.managerName,
          title: title(),
        })}
        loading={!data() || postInfo.loading}
      />

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
        <Toast
          message={localize(texts.content.loadingContent)}
          show={contentInfos().length > 0 && isLoading()}
          loading
        />
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
                                {localize(texts.content.download)}
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
                          {localize(option().label)}, {formatDate(request().date, currentLocale())}
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
                    <Show when={secondTitle() && secondTitle() !== title()}>
                      <p class={styles.titleRu}>{secondTitle()}</p>
                    </Show>
                  </section>

                  <Show
                    when={
                      postActions().some((action) => ['edit', 'precise', 'merge', 'order'].includes(action)) ||
                      (!postInfo().locationOptions && postActions().includes('locate')) ||
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
                            createPostPath(props.params.managerName, props.params.id),
                          )}
                          class={styles.action}
                        >
                          {localize(texts.support.order)}
                        </Button>
                      </Show>

                      <Show when={postInfo().status !== 'removed' && postActions().includes('edit')}>
                        <Button
                          href={createDetachedDialogFragment(
                            'post-editing',
                            createPostPath(props.params.managerName, props.params.id),
                          )}
                          class={styles.action}
                        >
                          {localize(texts.editing.edit)}
                        </Button>
                      </Show>

                      <Show when={postInfo().status !== 'removed' && postActions().includes('precise')}>
                        <Button
                          href={createDetachedDialogFragment(
                            'post-precising',
                            createPostPath(props.params.managerName, props.params.id),
                          )}
                          class={styles.action}
                        >
                          {localize(texts.editing.precise)}
                        </Button>
                      </Show>

                      <Show
                        when={
                          postInfo().status !== 'removed' &&
                          !postInfo().locationOptions &&
                          postActions().includes('locate')
                        }
                      >
                        <Button
                          class={styles.action}
                          href={createDetachedDialogFragment(
                            'post-location',
                            createPostPath(props.params.managerName, props.params.id),
                          )}
                        >
                          {localize(texts.editing.locate)}
                        </Button>
                      </Show>

                      <Show when={postInfo().status}>
                        <Button class={styles.action} onClick={handleReset}>
                          {postInfo().status === 'added'
                            ? localize(texts.editing.remove)
                            : localize(texts.editing.restore)}
                        </Button>
                      </Show>
                    </div>
                  </Show>

                  <Show when={description() || secondDescription()}>
                    <section class={styles.descriptions}>
                      <Show when={description()}>{(description) => <Markdown>{description()}</Markdown>}</Show>
                      <Show when={secondDescription() && secondDescription() !== description()}>
                        <Markdown>{secondDescription()!}</Markdown>
                      </Show>
                    </section>
                  </Show>
                </div>

                <Show when={postInfo().published}>
                  <span class={styles.publishedIcon}>
                    <GoldIcon class={styles.icon} />
                    {localize(texts.field.published)}
                  </span>
                </Show>

                <Show when={isValidDate(date())}>
                  <span class={styles.date}>{formatDate(date()!, currentLocale())}</span>
                </Show>

                <Show when={postInfo().status}>
                  {(status) => (
                    <span class={styles.status}>
                      <Icon color="attribute" size="small" variant="flat">
                        {capitalize(status())[0]}
                      </Icon>{' '}
                      {capitalize(status())}
                    </span>
                  )}
                </Show>

                <Divider />

                <Table
                  rows={[
                    { label: localize(texts.field.created), value: postInfo().created },
                    {
                      label: localize(texts.field.type),
                      value: () => (
                        <>
                          <Icon color="combat" size="small" variant="flat" class={styles.icon}>
                            <PostTypeGlyph type={postInfo().type} />
                          </Icon>
                          {localize(postTypeDescriptors[postInfo().type].title)}
                        </>
                      ),
                      link: postsRoute.createUrl({ managerName: props.params.managerName, type: postInfo().type }),
                    },
                    {
                      label: localize(texts.field.aspect),
                      value: aspectRatioToReadableText(postInfo().aspect),
                      link: postsRoute.createUrl({ managerName: props.params.managerName, aspect: postInfo().aspect }),
                    },
                    ...postInfo().authorOptions.map(
                      (option): TableRow => ({
                        label: localize(texts.field.author),
                        value: () => (
                          <>
                            <UserAvatar
                              image={option.image}
                              title={localize(option.label)}
                              size="small"
                              class={styles.avatar}
                            />
                            {localize(option.label)}
                          </>
                        ),
                        link: userRoute.createUrl({ id: option.value ?? '' }),
                        tooltip: (ref) => <UserTooltip forRef={ref} user={option.value} showAvatar />,
                      }),
                    ),
                    {
                      label: localize(texts.user.locator),
                      value: postInfo().locatorOption
                        ? () => (
                            <>
                              <UserAvatar
                                image={postInfo().locatorOption!.image}
                                title={localize(postInfo().locatorOption!.label)}
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
                      label: localize(texts.post.requestedBy),
                      value: postInfo().requesterOption
                        ? () => (
                            <>
                              <UserAvatar
                                image={postInfo().requesterOption!.image}
                                title={localize(postInfo().requesterOption!.label)}
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
                      tooltip: (ref) => (
                        <UserTooltip forRef={ref} user={postInfo().requesterOption!.value} showAvatar />
                      ),
                    },
                    {
                      label: localize(texts.field.placement),
                      value: postInfo().placement
                        ? localize(postPlacementDescriptors[postInfo().placement!].title)
                        : undefined,
                      link: postsRoute.createUrl({
                        managerName: props.params.managerName,
                        placement: postInfo().placement,
                      }),
                    },
                    { label: localize(texts.field.engine), value: postInfo().engine },
                    {
                      label: localize(texts.field.addon),
                      value: postInfo().addon,
                      link: postsRoute.createUrl({ managerName: props.params.managerName, addon: postInfo().addon }),
                    },
                    {
                      label: localize(texts.field.mark),
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
                      label: localize(texts.field.violation),
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
                              {localize(postViolationDescriptors[violation].title)}
                            </>
                          )
                        : undefined,
                      link: postInfo().violation
                        ? postsRoute.createUrl({ managerName: 'rejects', violation })
                        : undefined,
                    })),
                  ]}
                />

                <Show when={data()?.locationInfos?.length}>
                  <Divider />

                  <Table
                    label={localize(texts.location.locations)}
                    value={localize(texts.metrics.postCount)}
                    rows={
                      data()?.locationInfos?.map((info) => ({
                        label: localField(info, 'title') || '',
                        value: info.discovered?.posts,
                        link: postsRoute.createUrl({ managerName: 'posts', location: info.title, original: 'true' }),
                        tooltip: (ref) => <LocationTooltip forRef={ref} location={info} />,
                      })) ?? []
                    }
                    showEmptyValueRows
                  />
                </Show>

                <Show when={data()?.tagInfos?.length}>
                  <Divider />

                  <Table
                    label={localize(texts.field.tags)}
                    value={localize(texts.metrics.postCount)}
                    rows={
                      data()?.tagInfos?.map((info) => ({
                        label: info.id,
                        value: info.tagged?.posts,
                        link: postsRoute.createUrl({ managerName: 'posts', tag: info.id, original: 'true' }),
                      })) ?? []
                    }
                    showEmptyValueRows
                  />
                </Show>

                <Show when={stats().likes || stats().views || stats().commentCount || postInfo().rating}>
                  <Divider />

                  <Table
                    class={styles.table}
                    label={localize(texts.metrics.summaryCommunityActivity)}
                    rows={[
                      {
                        label: localize(texts.metrics.likes),
                        value: stats().likes,
                      },
                      {
                        label: localize(texts.metrics.views),
                        value: stats().views,
                      },
                      {
                        label: localize(texts.metrics.rating),
                        value: postInfo().rating,
                      },
                      {
                        label: localize(texts.metrics.comments),
                        value: stats().commentCount,
                      },
                    ]}
                  />
                </Show>

                <Show when={data()?.worldMapLocationInfo}>
                  <Frame class={styles.mapWrapper}>
                    <WorldMap
                      class={styles.map}
                      locations={[data()!.worldMapLocationInfo!]}
                      currentLocation={data()!.worldMapLocationInfo!.title}
                      discoveredLocations={data()!.locationInfos?.map((info) => info.title)}
                      onSelectLocation={(location) => {
                        if (!location) {
                          return;
                        }
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
                            {localize(texts.content.locatedByUserOnDate, {
                              user: localize(option().label),
                              date: formatDate(locating().date, currentLocale()),
                            })}
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
                          {capitalize(errors().join(', '))}
                        </p>
                      </section>
                    </>
                  )}
                </Show>

                <Spacer />

                <div class={styles.footer}>
                  <div class={styles.id}>
                    <Input value={createPostPath(props.params.managerName, props.params.id)} readonly />
                    <Button class={styles.copy} onClick={copyPathToClipboard}>
                      {localize(texts.common.copy)}
                    </Button>
                  </div>
                </div>
              </Frame>

              <Show when={data()?.publications}>
                {(publications) => (
                  <>
                    <PostComments publications={publications()} class={styles.comments} />

                    <PostPublications
                      managerName={props.params.managerName}
                      postIds={[props.params.id, ...(data()?.repostIds ?? [])]}
                      selectedPostId={repostId() ?? props.params.id}
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
    </>
  );
};

export default PostPage;

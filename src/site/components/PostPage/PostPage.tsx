import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import JsFileDownloader from 'js-file-downloader';
import type { JSX } from 'solid-js';
import { createMemo, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import type { PostEntry } from '../../../core/entities/post.js';
import {
  getPostCommentCount,
  getPostDateById,
  getPostEntryEngagement,
  getPostEntryFollowers,
  getPostEntryLikes,
  getPostEntryPublications,
  getPostEntryViews,
  getPostRating,
  getPostTypeAspectRatio,
  postTypeDescriptors,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import { isPublishablePost, isTrashItem } from '../../../core/entities/post-variation.js';
import { POSTS_MANAGER_INFOS } from '../../../core/entities/posts-manager.js';
import { parseResourceUrl, resourceIsImage, resourceIsVideo } from '../../../core/entities/resource.js';
import { getUserTitleLetter } from '../../../core/entities/user.js';
import { youtube } from '../../../core/services/youtube.js';
import { store } from '../../../core/stores/index.js';
import { asArray, capitalizeFirstLetter } from '../../../core/utils/common-utils.js';
import { formatDate, isValidDate } from '../../../core/utils/date-utils.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
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
import { PostComments } from '../PostComments/PostComments.js';
import { PostPublications } from '../PostPublications/PostPublications.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import { ResourcePreviews } from '../ResourcePreviews/ResourcePreviews.js';
import { ResourceSelector } from '../ResourceSelector/ResourceSelector.js';
import { Spacer } from '../Spacer/Spacer.js';
import type { TableRow } from '../Table/Table.js';
import { Table } from '../Table/Table.js';
import { Toast, useToaster } from '../Toaster/Toaster.js';
import { UserTooltip } from '../UserTooltip/UserTooltip.js';
import { WorldMap } from '../WorldMap/WorldMap.js';
import styles from './PostPage.module.css';

export const PostPage = (): JSX.Element => {
  const { addToast } = useToaster();
  const pageContext = usePageContext();
  const { data, params } = useRouteInfo(pageContext, postRoute);
  let selectedContentRef: HTMLImageElement | undefined;

  const [selectedContentIndex, setSelectedContentIndex] = createSignal(0);

  const postActions = createMemo(
    (): PostAction[] => POSTS_MANAGER_INFOS.find((info) => info.name === params().managerName)?.actions ?? [],
  );
  const postEntry = (): PostEntry | undefined => (data().post ? [params().id, data().post!] : undefined);

  const date = () => getPostDateById(params().id);
  const refDate = () => (data().refId ? getPostDateById(data().refId!) : undefined);

  const title = () => data().post?.title || 'Untitled';
  const titleRu = () => data().post?.titleRu || 'Без названия';
  const content = () => asArray(data().post?.content);
  const contentPublicUrls = () => content().map((url) => store.getPublicUrl(parseResourceUrl(url).pathname));
  const aspectRatio = () => (data().post ? getPostTypeAspectRatio(data().post!.type) : '1/1');
  const alt = () => data().post?.tags?.join(' ');
  const publishableErrors = () => {
    const errors: string[] = [];
    if (data().post && !isTrashItem(data().post!)) {
      isPublishablePost(data().post!, errors);
    }

    return errors.length > 0 ? errors : undefined;
  };

  const selectedContent = () => content()[selectedContentIndex()];
  const selectedContentPublicUrl = () => contentPublicUrls()[selectedContentIndex()];

  const youtubePost = () => data().post?.posts?.find((post) => post.service === 'yt');
  const youtubeUrl = () => (youtubePost() ? youtube.getPublicationUrl(youtubePost()!, true) : undefined);

  const published = () => Boolean(data().post?.posts);
  const withContent = () => content().length > 0;
  const withFullSizeContent = () =>
    Boolean(published() || contentPublicUrls().find((url) => typeof url === 'string') || youtubePost());
  const withContentSelection = () => withFullSizeContent() && content().length > 1;
  const withRequest = () => Boolean(data().post?.request);

  const [isLoading, setIsLoading] = createSignal(true);

  const selectContent = (url: string) => {
    const index = content().findIndex((u) => u === url);
    setSelectedContentIndex(index);
  };

  const copyIdToClipboard = () => {
    writeClipboard(params().id);
    addToast('Post ID copied to clipboard');
  };

  const handleContentLoad = () => {
    setIsLoading(false);
  };

  const handleContentError = (url: string) => {
    addToast(`Failed to load content: ${url}`);
    if (selectedContentRef && selectedContentRef.src !== YellowExclamationMark) {
      selectedContentRef.src = YellowExclamationMark;
    }
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
    const src = selectedContentPublicUrl();
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
        published() && styles.published,
        withContent() && styles.withContent,
        withContentSelection() && styles.withContentSelection,
        withFullSizeContent() && styles.withFullSizeContent,
        withRequest() && styles.withRequest,
        data().post?.type && styles[data().post!.type],
      )}
    >
      <Toast message="Loading Content" show={content().length > 0 && isLoading()} loading />
      <Show when={postEntry()}>
        {(postEntry) => {
          const [id, post] = postEntry();

          return (
            <>
              <Show when={withContent()}>
                <Show
                  when={withFullSizeContent()}
                  fallback={
                    <ResourcePreviews
                      urls={content()}
                      showTooltip
                      onLoad={handleContentLoad}
                      class={styles.contentPreviews}
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
                            <Frame
                              component="iframe"
                              width={804}
                              src={youtubeUrl()}
                              title={alt() || url()}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowfullscreen
                              // @ts-expect-error No proper typing
                              frameborder="0"
                              class={clsx(styles.selectedContent, styles.youtubeVideo)}
                              onLoad={handleContentLoad}
                              onError={() => handleContentError(youtubeUrl()!)}
                              style={{ 'aspect-ratio': aspectRatio() }}
                            />
                          </Match>
                          <Match when={resourceIsImage(url()) && selectedContentPublicUrl()}>
                            <Frame
                              component="img"
                              ref={selectedContentRef}
                              src={selectedContentPublicUrl()}
                              class={clsx(styles.selectedContent, styles.image)}
                              onLoad={handleContentLoad}
                              onError={() => handleContentError(selectedContentPublicUrl()!)}
                              style={{ 'aspect-ratio': aspectRatio() }}
                              aria-label={url() === YellowExclamationMark ? 'yellow exclamation mark' : alt() || url()}
                            />

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

              <Show when={post.request}>
                {(request) => (
                  <Frame variant="thin" class={styles.request}>
                    <p class={styles.requestText}>{request().text}</p>

                    <Show when={data().requesterOption}>
                      {(option) => (
                        <p class={styles.requestUser}>
                          {option().label}, {formatDate(post.request?.date!)}
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

                  <Show when={post.description || post.descriptionRu}>
                    <section class={styles.descriptions}>
                      <Show when={post.description}>
                        <p class={styles.description}>{post.description}</p>
                      </Show>
                      <Show when={post.descriptionRu}>
                        <p class={styles.description}>{post.descriptionRu}</p>
                      </Show>
                    </section>
                  </Show>
                </div>

                <Show when={post.posts}>
                  <span class={styles.publishedIcon}>
                    <GoldIcon class={styles.icon} />
                    Published
                  </span>
                </Show>

                <Show
                  when={
                    postActions().some((action) => ['edit', 'review', 'merge'].includes(action)) ||
                    (!post.location && postActions().includes('locate'))
                  }
                >
                  <div class={styles.actions}>
                    <Show when={postActions().includes('edit')}>
                      <Button
                        href={createDetachedDialogFragment('post-editing', { id, managerName: params().managerName })}
                        class={styles.action}
                      >
                        Edit
                      </Button>
                    </Show>
                    <Show when={postActions().includes('review')}>
                      <Button
                        href={createDetachedDialogFragment('post-review', { id, managerName: params().managerName })}
                        class={styles.action}
                      >
                        Review
                      </Button>
                    </Show>
                    <Show when={postActions().includes('merge')}>
                      <Button
                        href={createDetachedDialogFragment('post-merge', { id, managerName: params().managerName })}
                        class={styles.action}
                      >
                        Merge
                      </Button>
                    </Show>

                    <Show when={!post.location && postActions().includes('locate')}>
                      <Button
                        class={styles.action}
                        href={createDetachedDialogFragment('post-location', { id, managerName: params().managerName })}
                      >
                        Locate
                      </Button>
                    </Show>
                  </div>
                </Show>

                <Divider />

                <Table
                  rows={[
                    { label: 'Date', value: isValidDate(date()) ? date() : undefined },
                    {
                      label: 'Original Post Date',
                      value: isValidDate(refDate()) ? refDate() : undefined,
                      link: data().refId
                        ? postRoute.createUrl({ managerName: params().managerName, id: data().refId! })
                        : undefined,
                    },
                    {
                      label: 'Type',
                      value: postTypeDescriptors[post.type].title,
                      link: postsRoute.createUrl({ managerName: params().managerName, type: post.type }),
                    },
                    ...(data().authorOptions ?? []).map(
                      (option): TableRow => ({
                        label: 'Author',
                        value: () => (
                          <>
                            <Icon
                              color="stealth"
                              size="small"
                              variant="flat"
                              class={clsx(styles.icon, styles.tableIcon)}
                            >
                              {getUserTitleLetter(option.label)}
                            </Icon>
                            {option.label}
                          </>
                        ),
                        link: userRoute.createUrl({ id: option.value ?? '' }),
                        tooltip: (ref) => <UserTooltip forRef={ref} user={option.value} />,
                      }),
                    ),
                    {
                      label: 'Requester',
                      value: data().requesterOption
                        ? () => (
                            <>
                              <Icon
                                color="magic"
                                size="small"
                                variant="flat"
                                class={clsx(styles.icon, styles.tableIcon)}
                              >
                                {getUserTitleLetter(data().requesterOption?.label)}
                              </Icon>
                              {data().requesterOption!.label}
                            </>
                          )
                        : undefined,
                      link: data().requesterOption
                        ? userRoute.createUrl({ id: data().requesterOption!.value ?? '' })
                        : undefined,
                      tooltip: (ref) => <UserTooltip forRef={ref} user={data().requesterOption!.value} />,
                    },
                    { label: 'Engine', value: post.engine },
                    { label: 'Addon', value: post.addon },

                    {
                      label: 'Violation',
                      value: post.violation
                        ? () => (
                            <>
                              <Icon
                                color="health"
                                size="small"
                                variant="flat"
                                class={clsx(styles.icon, styles.tableIcon)}
                              >
                                {postViolationDescriptors[post.violation!].letter}
                              </Icon>
                              {postViolationDescriptors[post.violation!].title}
                            </>
                          )
                        : undefined,
                      link: post.violation
                        ? postsRoute.createUrl({ managerName: 'trash', violation: post.violation })
                        : undefined,
                    },
                  ]}
                />

                <Show when={data().locationInfos?.length}>
                  <Divider />

                  <Table
                    label="Locations"
                    value={() =>
                      postActions().includes('locate') && (
                        <Button
                          class={styles.action}
                          href={createDetachedDialogFragment('post-location', {
                            id,
                            managerName: params().managerName,
                          })}
                        >
                          Precise
                        </Button>
                      )
                    }
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

                <Show when={data().usedTags?.length}>
                  <Divider />

                  <Table
                    label="Tags"
                    rows={
                      data().usedTags?.map(([label, count]) => ({
                        label,
                        value: count,
                        link: postsRoute.createUrl({ managerName: 'posts', tag: label, original: 'true' }),
                      })) ?? []
                    }
                    showEmptyValueRows
                  />
                </Show>

                <Show when={publishableErrors()}>
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

                <Show when={post.posts || post.mark}>
                  <Divider />

                  <Table
                    class={styles.table}
                    label="Content Score"
                    rows={[
                      {
                        label: "Editor's Mark",
                        value: post.mark
                          ? () => (
                              <>
                                <Icon
                                  color="combat"
                                  size="small"
                                  variant="flat"
                                  class={clsx(styles.icon, styles.tableIcon)}
                                >
                                  {post.mark?.[0]}
                                </Icon>
                                {post.mark?.[1]}
                              </>
                            )
                          : undefined,
                        link: post.mark
                          ? postsRoute.createUrl({ managerName: 'posts', mark: post.mark, original: 'true' })
                          : undefined,
                      },
                      {
                        label: 'Rating',
                        value: Number(getPostRating(post).toFixed(2)),
                      },
                    ]}
                  />
                </Show>

                <Show when={post.posts}>
                  <Divider />

                  <Table
                    class={styles.table}
                    label="Reactions"
                    rows={[
                      {
                        label: 'Likes',
                        value: getPostEntryLikes(postEntry()),
                      },
                      {
                        label: 'Views',
                        value: getPostEntryViews(postEntry()),
                      },
                      {
                        label: 'Followers',
                        value: getPostEntryFollowers(postEntry()),
                      },
                      {
                        label: 'Engagement',
                        value: Number(getPostEntryEngagement(postEntry()).toFixed(2)),
                      },
                      {
                        label: 'Comments',
                        value: getPostCommentCount(post),
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

                <Spacer />

                <div class={styles.footer}>
                  <div class={styles.id}>
                    <Input value={id} readonly />
                    <Button class={styles.copy} onClick={copyIdToClipboard}>
                      Copy
                    </Button>
                  </div>
                </div>
              </Frame>

              <Show when={published()}>
                <PostComments post={post} class={styles.comments} />

                <PostPublications publications={getPostEntryPublications(postEntry())} class={styles.publications} />
              </Show>
            </>
          );
        }}
      </Show>
    </Frame>
  );
};

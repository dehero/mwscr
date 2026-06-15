import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { createAsync, revalidate } from '@solidjs/router';
import { createEffect, createMemo, createResource, createSignal, For, on, Show } from 'solid-js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { SelectPostInfosParams } from '../../../core/entities/post-info.js';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import type { SiteRoutePage } from '../../../core/entities/site-route.js';
import { AppPage } from '../../components/App/App.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { PostContentPreview } from '../../components/PostContentPreview/PostContentPreview.jsx';
import { PostPreviews } from '../../components/PostPreviews/PostPreviews.jsx';
import { Toast, useToaster } from '../../components/Toaster/Toaster.jsx';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usePostsPageOptions } from './hooks/usePostsPageOptions.js';
import { Options } from './Options.jsx';
import type { PostsPageData, PostsPageParams } from './PostsPage.data.js';
import { queryPostsPageData } from './PostsPage.data.js';
import styles from './PostsPage.module.css';

export const PostsPage: SiteRoutePage<PostsPageParams, PostsPageData> = (props) => {
  const data = createAsync(() => queryPostsPageData(props.params));

  const { messageBox } = useToaster();

  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const parameters = usePostsPageOptions(props.params);
  const managerDescriptor = createMemo(() => postsManagerDescriptors[props.params.managerName]);
  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[props.params.managerName].actions);

  const [expandParametersOnNarrowScreen, setExpandParametersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const [selected, setSelected] = createSignal<string[]>([]);
  const [selectedPostInfos] = createResource(selected, (ids) =>
    dataManager.getPostInfos(props.params.managerName, ids),
  );

  // Clear selection on manager change
  createEffect(
    on(
      () => props.params.managerName,
      () => setSelected([]),
      { defer: true },
    ),
  );

  const handleSelectedChange = (id: string, value: boolean) => {
    if (!value) {
      setSelected((selected) => selected.filter((i) => i !== id));
    } else {
      setSelected((selected) => [...selected, id]);
    }
  };

  const handleMerge = async () => {
    if (
      (await messageBox(`Are you sure you want to merge ${selected().length} selected posts?`, ['Yes', 'No'])) !== 0
    ) {
      return;
    }

    const [id, ...withIds] = selected();
    if (!id || withIds.length === 0) {
      return;
    }

    const manager = dataManager.findPostsManager(props.params.managerName);
    manager?.mergeItems(id, ...withIds);

    setSelected([]);
  };

  const selectParams = (): SelectPostInfosParams => ({
    type: parameters.type(),
    location: parameters.location(),
    tag: parameters.tag(),
    author: parameters.author(),
    locator: parameters.locator(),
    requester: parameters.requester(),
    mark: parameters.mark(),
    violation: parameters.violation(),
    original: parameters.original(),
    official: parameters.official(),
    publishable: parameters.publishable(),
    search: parameters.search(),
    sortKey: parameters.sortKey(),
    sortDirection: parameters.sortDirection(),
    date: parameters.date(),
    status: parameters.status(),
    placement: parameters.placement(),
    addon: parameters.addon(),
    aspect: parameters.aspect(),
  });

  const [postInfos, { refetch }] = createResource(selectParams, (selectParams) =>
    dataManager.selectPostInfos(props.params.managerName, selectParams),
  );

  useLocalPatch(() => {
    refetch();
    revalidate(queryPostsPageData.key);
  });

  return (
    <>
      <AppPage title={managerDescriptor().title} loading={!data()} />

      <Frame component="main" class={styles.container} ref={containerRef}>
        <Toast message="Loading Posts" show={postInfos.loading} loading />

        <Show when={data()}>
          {(data) => (
            <Options
              params={props.params}
              data={data()}
              options={parameters}
              class={styles.parameters}
              expandedOnNarrowScreen={expandParametersOnNarrowScreen()}
              onExpandedOnNarrowScreenChange={setExpandParametersOnNarrowScreen}
            />
          )}
        </Show>

        <Frame variant="thin" class={styles.postsWrapper}>
          <div class={styles.toolbar}>
            <Show when={postInfos()} fallback={<p class={styles.postInfosLabel}>Loading...</p>}>
              {(postInfos) => (
                <p class={styles.postInfosLabel}>
                  {selectPostInfosResultToString(postInfos().totalCount, postInfos().params)}
                </p>
              )}
            </Show>
            <Show when={selected().length > 0}>
              <fieldset class={styles.fieldset}>
                <div class={styles.selectedPosts}>
                  <For each={selectedPostInfos()}>
                    {(postInfo) => (
                      <PostContentPreview
                        content={postInfo.content}
                        aspectRatio={postInfo.aspect}
                        class={styles.selectedPost}
                      />
                    )}
                  </For>
                </div>
              </fieldset>

              <fieldset class={styles.fieldset}>
                <Button onClick={() => setSelected([])}>Clear Selection</Button>
                <Show when={postActions().includes('merge') && selected().length > 1}>
                  <Button onClick={handleMerge}>Merge Selected</Button>
                </Show>

                <Show when={postActions().includes('compile') && selected().length > 1}>
                  <Button
                    href={createDetachedDialogFragment('post-editing', 'drafts', {
                      mergeWith: selected().map((id) => createPostPath(props.params.managerName, id)),
                      type: 'compilation',
                      mark: '',
                      trash: '',
                    })}
                  >
                    Compile Selected
                  </Button>
                </Show>
              </fieldset>
            </Show>
            <Show when={postActions().includes('create')}>
              <fieldset class={styles.fieldset}>
                <Button href={createDetachedDialogFragment('post-editing', 'drafts')}>Create Draft</Button>
                <Button href={createDetachedDialogFragment('post-proposal')}>Submit Files</Button>
              </fieldset>
            </Show>
            <Show when={parameters.preset()}>
              <Button href={postsRoute.createUrl({ managerName: props.params.managerName })}>Reset Options</Button>
            </Show>
          </div>
          <Divider class={styles.toolbarDivider} />
          <Show when={postInfos()}>
            {(postInfos) => (
              <div class={styles.posts} ref={postsRef}>
                <PostPreviews
                  scrollTarget={postsScrollTarget()}
                  postInfos={postInfos().items}
                  selected={selected()}
                  onSelectedChange={
                    postActions().includes('merge') || postActions().includes('compile')
                      ? handleSelectedChange
                      : undefined
                  }
                />
              </div>
            )}
          </Show>
        </Frame>
      </Frame>
    </>
  );
};

export default PostsPage;

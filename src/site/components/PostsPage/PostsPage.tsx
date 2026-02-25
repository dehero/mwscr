import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createEffect, createMemo, createResource, createSignal, For, on, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import type { PostType } from '../../../core/entities/post.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../../core/entities/post-info.js';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import { createPostPath, postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import type { SiteRouteMeta } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.jsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.js';
import { PostContentPreview } from '../PostContentPreview/PostContentPreview.jsx';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { Toast, useToaster } from '../Toaster/Toaster.jsx';
import type { FilterKey, PresetKey } from './hooks/usePostsPageParameters.js';
import { usePostsPageParameters } from './hooks/usePostsPageParameters.js';
import { Parameters } from './Parameters.jsx';
import styles from './PostsPage.module.css';

export interface PostsPageInfo extends SiteRouteMeta {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
  typeKeys?: PostType[];
}

export const PostsPage = (): JSX.Element => {
  const { messageBox } = useToaster();

  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const pageContext = usePageContext();
  const routeInfo = useRouteInfo(pageContext, postsRoute);
  const { params } = routeInfo;

  const parameters = usePostsPageParameters(routeInfo);
  const postActions = createMemo((): PostAction[] => postsManagerDescriptors[params().managerName].actions);

  const [expandParametersOnNarrowScreen, setExpandParametersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const [selected, setSelected] = createSignal<string[]>([]);
  const [selectedPostInfos] = createResource(selected, (ids) => dataManager.getPostInfos(params().managerName, ids));

  // Clear selection on manager change
  createEffect(
    on(
      () => params().managerName,
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

    const manager = dataManager.findPostsManager(params().managerName);
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
    dataManager.selectPostInfos(params().managerName, selectParams),
  );

  useLocalPatch(refetch);

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
      <Toast message="Loading Posts" show={postInfos.loading} loading />

      <Parameters
        routeInfo={routeInfo}
        parameters={parameters}
        class={styles.parameters}
        expandedOnNarrowScreen={expandParametersOnNarrowScreen()}
        onExpandedOnNarrowScreenChange={setExpandParametersOnNarrowScreen}
      />

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
                    mergeWith: selected().map((id) => createPostPath(params().managerName, id)),
                    type: 'shot-set',
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
            <Button href={postsRoute.createUrl({ managerName: params().managerName })}>Reset Options</Button>
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
  );
};

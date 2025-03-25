import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createEffect, createMemo, createResource, createSignal, on, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../../core/entities/post-info.js';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import { postsManagerDescriptors } from '../../../core/entities/posts-manager.js';
import type { SiteRouteMeta } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.jsx';
import { Frame } from '../Frame/Frame.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { Toast, useToaster } from '../Toaster/Toaster.jsx';
import type { FilterKey, PresetKey } from './hooks/usePostsPageParameters.js';
import { usePostsPageParameters } from './hooks/usePostsPageParameters.js';
import { Parameters } from './Parameters.jsx';
import styles from './PostsPage.module.css';

export interface PostsPageSearchParams {
  type?: string;
  tag?: string;
  location?: string;
  placement?: string;
  author?: string;
  requester?: string;
  mark?: string;
  violation?: string;
  publishable?: string;
  original?: string;
  search?: string;
  sort?: string;
  date?: string;
  status?: string;
}

export interface PostsPageInfo extends SiteRouteMeta {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
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
    requester: parameters.requester(),
    mark: parameters.mark(),
    violation: parameters.violation(),
    original: parameters.original(),
    publishable: parameters.publishable(),
    search: parameters.search(),
    sortKey: parameters.sortKey(),
    sortDirection: parameters.sortDirection(),
    date: parameters.date(),
    status: parameters.status(),
    placement: parameters.placement(),
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

      <Frame variant="thin" class={styles.posts} ref={postsRef}>
        <Show when={postInfos()}>
          {(postInfos) => (
            <PostPreviews
              scrollTarget={postsScrollTarget()}
              postInfos={postInfos().items}
              label={selectPostInfosResultToString(postInfos().totalCount, postInfos().params, selected().length)}
              selected={selected()}
              onSelectedChange={postActions().includes('merge') ? handleSelectedChange : undefined}
              actions={[
                selected().length > 0 ? <Button onClick={() => setSelected([])}>Clear Selection</Button> : undefined,
                postActions().includes('merge') && selected().length > 1 ? (
                  <Button onClick={handleMerge}>Merge</Button>
                ) : undefined,
                parameters.preset() ? (
                  <Button href={postsRoute.createUrl({ managerName: params().managerName })}>
                    Reset<Show when={parameters.activeCount()}>{(count) => ` (${count()})`}</Show>
                  </Button>
                ) : undefined,
              ]}
            />
          )}
        </Show>
      </Frame>
    </Frame>
  );
};

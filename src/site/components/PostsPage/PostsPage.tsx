import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createResource, createSignal } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../../core/entities/post-info.js';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import type { SiteRouteMeta } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Frame } from '../Frame/Frame.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import type { FilterKey, PresetKey } from './hooks/usePostsPageParameters.js';
import { usePostsPageParameters } from './hooks/usePostsPageParameters.js';
import { Parameters } from './Parameters.jsx';
import styles from './PostsPage.module.css';

export interface PostsPageSearchParams {
  type?: string;
  tag?: string;
  location?: string;
  author?: string;
  requester?: string;
  mark?: string;
  violation?: string;
  publishable?: string;
  original?: string;
  search?: string;
  sort?: string;
  date?: string;
}

export interface PostsPageInfo extends SiteRouteMeta {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
}

export const PostsPage = (): JSX.Element => {
  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const pageContext = usePageContext();
  const routeInfo = useRouteInfo(pageContext, postsRoute);
  const { data, params } = routeInfo;

  const parameters = usePostsPageParameters(routeInfo);

  const [expandParametersOnNarrowScreen, setExpandParametersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

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
  });

  const [selectedPostInfos] = createResource(selectParams, (selectParams) =>
    dataManager.selectPostInfos(params().managerName, selectParams),
  );

  const postInfos = () =>
    selectedPostInfos.state === 'ready' ? selectedPostInfos() : selectedPostInfos.latest || data().lastPostInfos;

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
      <Parameters
        routeInfo={routeInfo}
        parameters={parameters}
        class={styles.parameters}
        expandedOnNarrowScreen={expandParametersOnNarrowScreen()}
        onExpandedOnNarrowScreenChange={setExpandParametersOnNarrowScreen}
      />

      <Frame variant="thin" class={styles.posts} ref={postsRef}>
        <PostPreviews
          scrollTarget={postsScrollTarget()}
          postInfos={postInfos().items}
          label={selectPostInfosResultToString(postInfos().totalCount, postInfos().params)}
        />
      </Frame>
    </Frame>
  );
};

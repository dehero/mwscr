import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { type Component, createResource, createSignal } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { usePageContext } from 'vike-solid/usePageContext';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type {
  PostInfoSelection,
  SelectPostInfosParams,
  SelectPostInfosSortKey,
} from '../../../core/entities/post-info.js';
import { selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import { siteDataExtractor } from '../../data-managers/extractor.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { Frame } from '../Frame/Frame.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { Parameters } from './Parameters.jsx';
import styles from './PostsPage.module.css';
import type { FilterKey, PresetKey } from './usePostsPageParameters.js';
import { usePostsPageParameters } from './usePostsPageParameters.js';

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

export interface PostsPageData {
  lastPostInfos: PostInfoSelection;
  authorInfos: UserInfo[];
  requesterInfos: UserInfo[];
  locationInfos: LocationInfo[];
  tagOptions: Option[];
}

export interface PostsPageInfo extends SiteRouteInfo {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
  actions?: PostAction[];
}

export const PostsPage: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const pageContext = usePageContext();
  const info = () => useRouteInfo<PostsPageInfo>(pageContext);

  const parameters = usePostsPageParameters(info);
  const { lastPostInfos } = useData<PostsPageData>();

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

  const [selectedPostInfos] = createResource(selectParams, (params) =>
    siteDataExtractor.selectPostInfos(parameters.routeParams().managerName, params),
  );

  const postInfos = () =>
    selectedPostInfos.state === 'ready' ? selectedPostInfos() : selectedPostInfos.latest || lastPostInfos;

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
      <Parameters
        info={info()}
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

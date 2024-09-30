import { createMediaQuery } from '@solid-primitives/media';
import { createSignal, type Component } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { usePageContext } from 'vike-solid/usePageContext';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import type { PostAction } from '../../../core/entities/post-action.js';
import type { PostInfo, SelectPostInfosParams, SelectPostInfosSortKey } from '../../../core/entities/post-info.js';
import { selectPostInfos, selectPostInfosResultToString } from '../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { Frame } from '../Frame/Frame.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import styles from './PostsPage.module.css';
import { FilterKey, PresetKey, usePostsPageParameters } from './usePostsPageParameters.js';
import { Parameters } from './Parameters.jsx';
import { makePersisted } from '@solid-primitives/storage';

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
  postInfos: PostInfo[];
  authorOptions: Option[];
  requesterOptions: Option[];
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

  const [expandParametersOnNarrowScreen, setExpandParametersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const { postInfos } = useData<PostsPageData>();

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

  const selectedPostInfos = () => selectPostInfos(postInfos, selectParams());

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
          postInfos={selectedPostInfos()}
          label={selectPostInfosResultToString(selectedPostInfos().length, selectParams())}
        />
      </Frame>
    </Frame>
  );
};

import { type Component, createSignal, For, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { isNestedLocation } from '../../../core/entities/location.js';
import type { PostMark, PostType, PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import {
  comparePostInfosById,
  comparePostInfosByLikes,
  comparePostInfosByMark,
  comparePostInfosByRating,
  comparePostInfosByViews,
} from '../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { stringToBool } from '../../../core/utils/common-utils.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import { postsRoute, postsRouteInfos } from '../../routes/posts-route.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.jsx';
import { Divider } from '../Divider/Divider.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { RouteButton } from '../RouteButton/RouteButton.js';
import type { SelectOption } from '../Select/Select.js';
import { Select } from '../Select/Select.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Toast } from '../Toaster/Toaster.js';
import styles from './PostsPage.module.css';

const comparators = [
  { value: 'id', label: 'ID', fn: comparePostInfosById },
  { value: 'likes', label: 'Likes', fn: comparePostInfosByLikes },
  { value: 'views', label: 'Views', fn: comparePostInfosByViews },
  { value: 'rating', label: 'Rating', fn: comparePostInfosByRating },
  { value: 'mark', label: "Editor's Mark", fn: comparePostInfosByMark },
] as const;

export type PostsPageSortKey = (typeof comparators)[number]['value'];

const presets = [
  { value: 'editors-choice', label: "Editor's Choice", params: { sort: 'mark,desc', reposted: 'false' } },
  { value: 'shortlist', label: 'Shortlist', params: { publishable: 'true' } },
  { value: 'requests', label: 'Requests', params: { requested: 'true' }, reposted: 'false' },
  { value: 'revisit', label: 'Revisit', params: { mark: 'F' } },
  { value: 'unlocated', label: 'Unlocated', params: { location: NONE_OPTION.value, reposted: 'false' } },
  { value: 'violations', label: 'Violations', params: { violation: ANY_OPTION.value } },
] as const;

type PresetKey = (typeof presets)[number]['value'];

export interface PostsPageSearchParams {
  type?: string;
  tag?: string;
  location?: string;
  author?: string;
  mark?: string;
  violation?: string;
  publishable?: string;
  requested?: string;
  reposted?: string;
  search?: string;
  sort?: string;
}

type FilterKey = keyof Pick<
  PostsPageSearchParams,
  'type' | 'tag' | 'location' | 'author' | 'mark' | 'violation' | 'publishable' | 'requested' | 'reposted'
>;

export interface PostsPageInfo extends SiteRouteInfo {
  presetKeys?: PresetKey[];
  filters?: FilterKey[];
  sortKeys?: PostsPageSortKey[];
}

interface SelectPostInfosParams {
  skipReferences?: boolean;
  type?: PostType;
  tag?: string;
  location?: string;
  search?: string;
  author?: string;
  mark?: PostMark;
  violation?: string; // PostViolation | typeof ANY_OPTION.value | typeof NONE_OPTION.value;
  publishable?: boolean;
  requested?: boolean;
  reposted?: boolean;
  sortKey: PostsPageSortKey;
  sortDirection: SortDirection;
}

const emptySearchParams: PostsPageSearchParams = {
  type: undefined,
  tag: undefined,
  location: undefined,
  author: undefined,
  mark: undefined,
  violation: undefined,
  publishable: undefined,
  requested: undefined,
  reposted: undefined,
  search: undefined,
  sort: undefined,
};

export interface PostsPageData {
  postInfos: PostInfo[];
  authorOptions: SelectOption<string>[];
  locationOptions: SelectOption<string>[];
  tagOptions: SelectOption<string>[];
}

const selectPostInfos = (postInfos: PostInfo[], params: SelectPostInfosParams): PostInfo[] => {
  const comparator = comparators.find((comparator) => comparator.value === params.sortKey)?.fn ?? comparePostInfosById;

  return [...postInfos]
    .sort(comparator(params.sortDirection))
    .filter((info) =>
      Boolean(
        (typeof params.publishable === 'undefined' || params.publishable !== Boolean(info.publishableCheck)) &&
          (typeof params.requested === 'undefined' || params.requested === Boolean(info.request)) &&
          (typeof params.reposted === 'undefined' || params.reposted === Boolean(info.refId)) &&
          (typeof params.type === 'undefined' || info.type === params.type) &&
          (typeof params.tag === 'undefined' || info.tags?.includes(params.tag)) &&
          (typeof params.author === 'undefined' || info.authorEntries.some(([id]) => id === params.author)) &&
          (typeof params.location === 'undefined' ||
            (params.location === ANY_OPTION.value && info.location) ||
            (params.location === NONE_OPTION.value && !info.location) ||
            (info.location && isNestedLocation(info.location.title, params.location))) &&
          (typeof params.mark === 'undefined' || info.mark === params.mark) &&
          (typeof params.violation === 'undefined' ||
            (params.violation === ANY_OPTION.value && info.violation) ||
            (params.violation === NONE_OPTION.value && !info.violation) ||
            info.violation === params.violation) &&
          (typeof params.search === 'undefined' ||
            info.title?.toLocaleLowerCase()?.includes(params.search.toLocaleLowerCase())),
      ),
    );
};

export const PostsPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<PostsPageSearchParams>();

  const info = useRouteInfo<PostsPageInfo>();

  const sortOptions = () => comparators.filter((item) => !info.sortKeys || info.sortKeys.includes(item.value));
  const presetOptions = () => presets.filter((item) => !info.presetKeys || info.presetKeys.includes(item.value));

  const postRequested = () => stringToBool(searchParams.requested);
  const postReposted = () => stringToBool(searchParams.reposted);
  const postPublishable = () => stringToBool(searchParams.publishable);
  const postType = () => POST_TYPES.find((type) => type === searchParams.type);
  const postTag = () => searchParams.tag;
  const postLocation = () => searchParams.location;
  const postAuthor = () => searchParams.author;
  const postMark = () => POST_MARKS.find((mark) => mark === searchParams.mark);
  const postViolation = () => searchParams.violation;
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'id';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;
  const preset = () =>
    presetOptions().find((preset) =>
      Object.entries(preset.params).every(([key, value]) => searchParams[key as keyof PostsPageSearchParams] === value),
    )?.value;

  const setPreset = (preset: PresetKey | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.params });
  const setPostRequested = (requested: boolean | undefined) => setSearchParams({ requested });
  const setPostReposted = (reposted: boolean | undefined) => setSearchParams({ reposted });
  const setPostPublishable = (publishable: boolean | undefined) => setSearchParams({ publishable });
  const setPostType = (type: PostType | undefined) => setSearchParams({ type });
  const setPostTag = (tag: string | undefined) => setSearchParams({ tag });
  const setPostLocation = (location: string | undefined) => setSearchParams({ location });
  const setPostAuthor = (author: string | undefined) => setSearchParams({ author });
  const setPostMark = (mark: PostMark | undefined) => setSearchParams({ mark });
  const setPostViolation = (violation: ReturnType<typeof postViolation>) => setSearchParams({ violation });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: PostsPageSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });

  const [isSearching, setIsSearching] = createSignal(false);

  const getPostParams = (): SelectPostInfosParams => ({
    skipReferences: sortKey() !== 'id',
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    author: postAuthor(),
    mark: postMark(),
    violation: postViolation(),
    requested: postRequested(),
    reposted: postReposted(),
    publishable: postPublishable(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const { postInfos, tagOptions, locationOptions, authorOptions } = useData<PostsPageData>();

  const filteredPostInfos = () => selectPostInfos(postInfos, getPostParams());

  return (
    <>
      <div class={styles.header}>
        <RadioGroup name="preset" options={[ALL_OPTION, ...presetOptions()]} value={preset()} onChange={setPreset} />

        <Show when={sortOptions().length > 0}>
          <fieldset class={styles.fieldset}>
            <Label label="Order By">
              <Select options={sortOptions()} value={sortKey()} onChange={setSortKey} />
            </Label>
            <RadioGroup
              name="sortDirection"
              options={[
                { value: 'asc', label: 'Asc' },
                { value: 'desc', label: 'Desc' },
              ]}
              value={sortDirection()}
              onChange={setSortDirection}
            />
          </fieldset>
        </Show>

        <Spacer />

        <fieldset class={styles.fieldset}>
          <Label label="Search">
            <Input
              name="search"
              value={searchTerm()}
              onChange={() => setIsSearching(true)}
              onDebouncedChange={(value) => {
                setSearchTerm(value);
                setIsSearching(false);
              }}
            />
          </Label>
          <Button
            onClick={(e) => {
              e.preventDefault();
              setSearchTerm('');
              setIsSearching(false);
            }}
          >
            Clear
          </Button>

          <Toast message="Searching..." show={isSearching()} />
        </fieldset>

        <nav class={styles.nav}>
          <For each={Object.keys(postsRouteInfos)}>
            {(managerName) => <RouteButton route={postsRoute} params={{ managerName }} matchParams />}
          </For>
        </nav>
      </div>
      <form class={styles.filters}>
        <Show when={!info.filters || info.filters.includes('type')}>
          <RadioGroup
            name="type"
            options={[{ value: undefined, label: 'Any' }, ...POST_TYPES.map((value) => ({ value }))]}
            value={postType()}
            onChange={setPostType}
          />
        </Show>
        <Show when={!info.filters || info.filters.includes('location')}>
          <Label label="Location">
            <Select
              name="location"
              options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...locationOptions]}
              value={postLocation()}
              onChange={setPostLocation}
            />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('tag')}>
          <Label label="Tag">
            <Select name="tag" options={[ALL_OPTION, ...tagOptions]} value={postTag()} onChange={setPostTag} />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('author')}>
          <Label label="Author">
            <Select
              name="author"
              options={[ALL_OPTION, ...authorOptions]}
              value={postAuthor()}
              onChange={setPostAuthor}
            />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('mark')}>
          <Label label="Editor's Mark">
            <Select
              name="mark"
              options={[ALL_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
              value={postMark()}
              onChange={setPostMark}
            />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('violation')}>
          <Label label="Violation">
            <Select
              name="violation"
              options={[
                ALL_OPTION,
                ANY_OPTION,
                NONE_OPTION,
                ...Object.entries(POST_VIOLATIONS).map(([value, violation]) => ({
                  value: value as PostViolation,
                  label: violation.title,
                })),
              ]}
              value={postViolation()}
              onChange={setPostViolation}
            />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('requested')}>
          <Label label="Requested" position="end">
            <Checkbox name="requested" value={postRequested()} tristate onChange={setPostRequested} />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('reposted')}>
          <Label label="Reposted" position="end">
            <Checkbox name="reposted" value={postReposted()} tristate onChange={setPostReposted} />
          </Label>
        </Show>
        <Show when={!info.filters || info.filters.includes('publishable')}>
          <Label label="Publishable" position="end">
            <Checkbox name="publishable" value={postPublishable()} tristate onChange={setPostPublishable} />
          </Label>
        </Show>
      </form>

      <Divider />

      <PostPreviews postInfos={filteredPostInfos()} />
    </>
  );
};

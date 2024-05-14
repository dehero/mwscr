import { useCurrentMatches, useSearchParams } from '@solidjs/router';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import type { Location } from '../../../core/entities/location.js';
import { isNestedLocation } from '../../../core/entities/location.js';
import type { Post, PostEntries, PostMark, PostType, PostViolation } from '../../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  comparePostEntriesByViews,
  getPostEntriesFromSource,
  POST_MARKS,
  POST_TYPES,
  POST_VIOLATIONS,
} from '../../../core/entities/post.js';
import { isPostRequest, isPublishablePost } from '../../../core/entities/post-variation.js';
import type { PostsManager } from '../../../core/entities/posts-manager.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Button } from '../../components/Button/Button.js';
import { Divider } from '../../components/Divider/Divider.js';
import { Input } from '../../components/Input/Input.js';
import { Page } from '../../components/Page/Page.js';
import { PostPreviews } from '../../components/PostPreviews/PostPreviews.js';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.js';
import type { SelectOption } from '../../components/Select/Select.js';
import { Select } from '../../components/Select/Select.js';
import { getUserName } from '../../data-managers/users.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../utils/ui-constants.js';
import styles from './PostsPage.module.css';

const comparators = [
  { value: 'id', label: 'ID', fn: comparePostEntriesById },
  { value: 'likes', label: 'Likes', fn: comparePostEntriesByLikes },
  { value: 'views', label: 'Views', fn: comparePostEntriesByViews },
  { value: 'rating', label: 'Rating', fn: comparePostEntriesByRating },
] as const;

type ComparatorKey = (typeof comparators)[number]['value'];

const checks = [
  { value: 'publishable', label: 'Publishable', fn: isPublishablePost },
  { value: 'requested', label: 'Requested', fn: isPostRequest },
] as const;

type CheckKey = (typeof checks)[number]['value'];

const presets = [
  { value: 'editors-choice', label: "Editor's Choice", params: { mark: 'A1', sort: 'rating,desc' } },
  { value: 'shortlist', label: 'Shortlist', params: { check: 'publishable' } },
  { value: 'requests', label: 'Requests', params: { check: 'requested' } },
  { value: 'revisit', label: 'Revisit', params: { mark: 'F' } },
  { value: 'unlocated', label: 'Unlocated', params: { location: NONE_OPTION.value } },
  { value: 'violations', label: 'Violations', params: { violation: ANY_OPTION.value } },
] as const;

type PresetKey = (typeof presets)[number]['value'];

export interface PostsPageSearchParams {
  type?: PostType;
  tag?: string;
  location?: string;
  author?: string;
  mark?: PostMark;
  violation?: PostViolation;
  check?: CheckKey;
  search?: string;
  sort?: `${ComparatorKey},${SortDirection}`;
}

type FilterKey = keyof Pick<
  PostsPageSearchParams,
  'type' | 'tag' | 'location' | 'author' | 'mark' | 'violation' | 'check'
>;

export interface PostsPageRouteInfo extends SiteRouteInfo {
  manager: PostsManager;
  title?: string;
  presetKeys?: PresetKey[];
  filters?: FilterKey[];
  checkKeys?: CheckKey[];
  sortKeys?: ComparatorKey[];
}

interface GetPostsParams {
  manager: PostsManager;
  skipReferences?: boolean;
  type?: PostType;
  tag?: string;
  location?: string;
  search?: string;
  author?: string;
  mark?: PostMark;
  violation?: PostViolation;
  check?: CheckKey;
  sortKey: ComparatorKey;
  sortDirection: SortDirection;
}

const emptySearchParams: PostsPageSearchParams = {
  type: undefined,
  tag: undefined,
  location: undefined,
  author: undefined,
  mark: undefined,
  violation: undefined,
  check: undefined,
  search: undefined,
  sort: undefined,
};

const getPosts = async (params: GetPostsParams): Promise<PostEntries> => {
  const comparator =
    comparators.find((comparator) => comparator.value === params.sortKey)?.fn ?? comparePostEntriesById;

  const checker = checks.find((variation) => variation.value === params.check)?.fn;

  return await getPostEntriesFromSource(
    () => params.manager.readAllEntries(params.skipReferences),
    comparator(params.sortDirection),
    (post): post is Post =>
      Boolean(
        (typeof checker === 'undefined' || checker(post)) &&
          (typeof params.type === 'undefined' || post.type === params.type) &&
          (typeof params.tag === 'undefined' || post.tags?.includes(params.tag)) &&
          (typeof params.author === 'undefined' || asArray(post.author).includes(params.author)) &&
          (typeof params.location === 'undefined' ||
            (params.location === ANY_OPTION.value && post.location) ||
            (params.location === NONE_OPTION.value && !post.location) ||
            (post.location && isNestedLocation(post.location, params.location))) &&
          (typeof params.mark === 'undefined' || post.mark === params.mark) &&
          (typeof params.violation === 'undefined' ||
            (params.violation === ANY_OPTION.value && post.violation) ||
            (params.violation === NONE_OPTION.value && !post.violation) ||
            post.violation === params.violation) &&
          (typeof params.search === 'undefined' ||
            post.title?.toLocaleLowerCase()?.includes(params.search.toLocaleLowerCase())),
      ),
  );
};

const getTagOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedTags = await postsManager.getUsedTags();

  return [...usedTags]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: `${value} (${count})` }));
};

const getLocationOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedLocations = await postsManager.getUsedLocations();
  const usedLocationsWithNesting = new Map();
  const { default: data } = await import('../../../../data/locations.yml');

  const locations = data as Location[];

  for (const location of locations) {
    const count = [...usedLocations]
      .filter(([value]) => isNestedLocation(value, location.title))
      .reduce((acc, [, count]) => acc + count, 0);

    if (count > 0) {
      usedLocationsWithNesting.set(location.title, count);
    }
  }

  return [...usedLocationsWithNesting]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: `${value} (${count})` }));
};

const getAuthorOptions = async (postsManager: PostsManager): Promise<SelectOption<string>[]> => {
  const usedAuthors = await postsManager.getUsedAuthors();

  return [...usedAuthors]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({ value, label: `${getUserName(value)} (${count})` }));
};

export const PostsPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<Required<PostsPageSearchParams>>();

  const routeMatches = useCurrentMatches();
  const info = () => routeMatches[0]?.route.info as PostsPageRouteInfo;

  const sortOptions = () => comparators.filter((item) => !info().sortKeys || info().sortKeys?.includes(item.value));
  const checkOptions = () => checks.filter((item) => !info().checkKeys || info().checkKeys?.includes(item.value));
  const presetOptions = () => presets.filter((item) => !info().presetKeys || info().presetKeys?.includes(item.value));

  const check = () => checkOptions().find((variation) => variation.value === searchParams.check)?.value;
  const postType = () => POST_TYPES.find((type) => type === searchParams.type);
  const postTag = () => searchParams.tag;
  const postLocation = () => searchParams.location;
  const postAuthor = () => searchParams.author;
  const postMark = () => POST_MARKS.find((mark) => mark === searchParams.mark);
  const postViolation = () => searchParams.violation as PostViolation | undefined;
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'id';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;
  const preset = () =>
    presetOptions().find((preset) =>
      Object.entries(preset.params).every(([key, value]) => searchParams[key as keyof PostsPageSearchParams] === value),
    )?.value;

  const setPreset = (preset: PresetKey | undefined) => {
    console.log(presetOptions().find((item) => item.value === preset));
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.params });
  };
  const setCheck = (check: CheckKey | undefined) => setSearchParams({ check });
  const setPostType = (type: PostType | undefined) => setSearchParams({ type });
  const setPostTag = (tag: string | undefined) => setSearchParams({ tag });
  const setPostLocation = (location: string | undefined) => setSearchParams({ location });
  const setPostAuthor = (author: string | undefined) => setSearchParams({ author });
  const setPostMark = (mark: PostMark | undefined) => setSearchParams({ mark });
  const setPostViolation = (violation: string | undefined) => setSearchParams({ violation });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: ComparatorKey | undefined) => setSearchParams({ sort: `${key},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction}` });

  const [isSearching, setIsSearching] = createSignal(false);

  const getPostParams = (): GetPostsParams => ({
    manager: info().manager,
    skipReferences: sortKey() !== 'id',
    check: check(),
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    author: postAuthor(),
    mark: postMark(),
    violation: postViolation(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const [posts] = createResource(getPostParams, getPosts);
  const [tagOptions] = createResource(info().manager, getTagOptions);
  const [locationOptions] = createResource(info().manager, getLocationOptions);
  const [authorOptions] = createResource(info().manager, getAuthorOptions);

  return (
    <Page status={posts.loading ? 'Loading...' : isSearching() ? 'Searching...' : undefined} title={info().title}>
      <div class={styles.header}>
        <RadioGroup name="preset" options={[ALL_OPTION, ...presetOptions()]} value={preset()} onChange={setPreset} />

        <fieldset class={styles.fieldset}>
          <Input
            label="Search"
            name="search"
            value={searchTerm()}
            onChange={() => setIsSearching(true)}
            onDebouncedChange={(value) => {
              setSearchTerm(value);
              setIsSearching(false);
            }}
          />
          <Button
            onClick={(e) => {
              e.preventDefault();
              setSearchTerm('');
              setIsSearching(false);
            }}
          >
            Clear
          </Button>
        </fieldset>
      </div>
      <form class={styles.filters}>
        <Show when={!info().filters || info().filters?.includes('type')}>
          <RadioGroup
            label="Type"
            name="type"
            options={[{ value: undefined, label: 'Any' }, ...POST_TYPES.map((value) => ({ value }))]}
            value={postType()}
            onChange={setPostType}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('location')}>
          <Select
            label="Location"
            name="location"
            options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...(locationOptions() ?? [])]}
            value={postLocation()}
            onChange={setPostLocation}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('tag')}>
          <Select
            label="Tag"
            name="tag"
            options={[ALL_OPTION, ...(tagOptions() ?? [])]}
            value={postTag()}
            onChange={setPostTag}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('author')}>
          <Select
            label="Author"
            name="author"
            options={[ALL_OPTION, ...(authorOptions() ?? [])]}
            value={postAuthor()}
            onChange={setPostAuthor}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('mark')}>
          <Select
            label="Editor's Mark"
            name="mark"
            options={[ALL_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
            value={postMark()}
            onChange={setPostMark}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('violation')}>
          <Select
            label="Violation"
            name="violation"
            options={[
              ALL_OPTION,
              ANY_OPTION,
              NONE_OPTION,
              ...Object.entries(POST_VIOLATIONS).map(([value, label]) => ({ value, label })),
            ]}
            value={postViolation()}
            onChange={setPostViolation}
          />
        </Show>
        <Show when={!info().filters || info().filters?.includes('check')}>
          <Select
            label="Check"
            name="check"
            options={[ALL_OPTION, ...checkOptions()]}
            value={check()}
            onChange={setCheck}
          />
        </Show>
        <Show when={sortOptions().length > 0}>
          <fieldset class={styles.fieldset}>
            <Select label="Order By" options={sortOptions()} value={sortKey()} onChange={setSortKey} />
            <Select
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
              value={sortDirection()}
              onChange={setSortDirection}
            />
          </fieldset>
        </Show>
      </form>

      <Divider />

      <Show when={!posts.loading}>
        <PostPreviews postEntries={posts() ?? []} managerName={info().manager.name} />
      </Show>
    </Page>
  );
};

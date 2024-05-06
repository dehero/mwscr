import { useNavigate, useSearchParams } from '@solidjs/router';
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
import type { SortDirection } from '../../../core/utils/common-types.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { getUserName } from '../../data-managers/users.js';
import { Button } from '../Button/Button.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Input } from '../Input/Input.jsx';
import { Page } from '../Page/Page.jsx';
import { PostPreviews } from '../PostPreviews/PostPreviews.jsx';
import { RadioGroup } from '../RadioGroup/RadioGroup.jsx';
import { Select } from '../Select/Select.jsx';
import styles from './PostsPage.module.css';

const ALL_OPTION = { value: undefined, label: 'All' };
const ANY_OPTION = { value: 'any', label: 'Any' };
const NONE_OPTION = { value: 'none', label: 'None' };

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

export interface PostsPageProps {
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
    () => params.manager.getAllPosts(params.skipReferences),
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

const getUsedTags = async (postsManager: PostsManager): Promise<string[]> => {
  const result: Set<string> = new Set();

  for await (const [, post] of postsManager.getAllPosts(true)) {
    if (typeof post !== 'string') {
      post.tags?.forEach((tag) => result.add(tag));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getUsedLocations = async (postsManager: PostsManager): Promise<string[]> => {
  const result: Set<string> = new Set();
  const { default: data } = await import('../../../../data/locations.yml');

  const locations = data as Location[];

  for await (const [, post] of postsManager.getAllPosts(true)) {
    if (typeof post !== 'string' && post.location) {
      locations
        .filter((location) => post.location && isNestedLocation(post.location, location.title))
        .forEach((location) => result.add(location.title));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getUsedUsers = async (postsManager: PostsManager): Promise<string[]> => {
  const result: Set<string> = new Set();

  for await (const [, post] of postsManager.getAllPosts(true)) {
    if (typeof post !== 'string') {
      asArray(post.author).forEach((author) => result.add(author));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

export const PostsPage: Component<PostsPageProps> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams<Required<PostsPageSearchParams>>();
  const navigate = useNavigate();

  const sortOptions = () => comparators.filter((item) => !props.sortKeys || props.sortKeys.includes(item.value));
  const checkOptions = () => checks.filter((item) => !props.checkKeys || props.checkKeys.includes(item.value));
  const presetOptions = () => presets.filter((item) => !props.presetKeys || props.presetKeys.includes(item.value));

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

  const setPreset = (preset: PresetKey | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.params });
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
    manager: props.manager,
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
  const [usedTags] = createResource(props.manager, getUsedTags);
  const [usedLocations] = createResource(props.manager, getUsedLocations);
  const [usedUsers] = createResource(props.manager, getUsedUsers);

  return (
    <Page status={posts.loading ? 'Loading...' : isSearching() ? 'Searching...' : undefined} title={props.title}>
      <>
        <form class={styles.filter}>
          <RadioGroup name="preset" options={[ALL_OPTION, ...presetOptions()]} value={preset()} onChange={setPreset} />

          <Show when={!props.filters || props.filters.includes('type')}>
            <RadioGroup
              label="Type"
              name="type"
              options={[ALL_OPTION, ...POST_TYPES.map((value) => ({ value }))]}
              value={postType()}
              onChange={setPostType}
            />
          </Show>
          <Show when={!props.filters || props.filters.includes('location')}>
            <Select
              label="Location"
              name="location"
              options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...(usedLocations()?.map((value) => ({ value })) ?? [])]}
              value={postLocation()}
              onChange={setPostLocation}
            />
          </Show>
          <Show when={!props.filters || props.filters.includes('tag')}>
            <Select
              label="Tag"
              name="tag"
              options={[ALL_OPTION, ...(usedTags()?.map((value) => ({ value })) ?? [])]}
              value={postTag()}
              onChange={setPostTag}
            />
          </Show>
          <Show when={!props.filters || props.filters.includes('author')}>
            <Select
              label="Author"
              name="author"
              options={[ALL_OPTION, ...(usedUsers()?.map((value) => ({ value, label: getUserName(value) })) ?? [])]}
              value={postAuthor()}
              onChange={setPostAuthor}
            />
          </Show>
          <Show when={!props.filters || props.filters.includes('mark')}>
            <Select
              label="Editor's Mark"
              name="mark"
              options={[ALL_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
              value={postMark()}
              onChange={setPostMark}
            />
          </Show>
          <Show when={!props.filters || props.filters.includes('violation')}>
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
          <Show when={!props.filters || props.filters.includes('check')}>
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

          <Button
            onClick={(e) => {
              e.preventDefault();
              navigate('./');
            }}
          >
            Reset
          </Button>
        </form>

        <Divider />

        <Show when={!posts.loading}>
          <PostPreviews postEntries={posts() ?? []} managerName={props.manager.name} />
        </Show>
      </>
    </Page>
  );
};

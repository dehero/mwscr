import { useSearchParams } from '@solidjs/router';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import type { Location } from '../../../core/entities/location.js';
import { isNestedLocation } from '../../../core/entities/location.js';
import type { Post, PostEntries, PostMark, PostType } from '../../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  comparePostEntriesByViews,
  getPostEntriesFromSource,
  POST_MARKS,
  POST_TYPES,
} from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { Page } from '../../components/Page/Page.jsx';
import { PostPreviews } from '../../components/PostPreviews/PostPreviews.jsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.jsx';
import { Select } from '../../components/Select/Select.jsx';
import { published } from '../../data-managers/posts.js';
import { getUserName } from '../../data-managers/users.js';
import type { PublishedRouteParams } from '../../routes/published-route.js';
import styles from './PublishedPage.module.css';

const comparators = [
  { value: 'id', label: 'ID', fn: comparePostEntriesById },
  { value: 'likes', label: 'Likes', fn: comparePostEntriesByLikes },
  { value: 'views', label: 'Views', fn: comparePostEntriesByViews },
  { value: 'rating', label: 'Rating', fn: comparePostEntriesByRating },
] as const;

type ComparatorKey = (typeof comparators)[number]['value'];

interface PostsFilter {
  skipReferences?: boolean;
  type?: PostType;
  tag?: string;
  location?: string; // | null;
  search?: string;
  author?: string;
  mark?: PostMark;
  sortKey?: ComparatorKey;
}

const getPosts = async (filter: PostsFilter): Promise<PostEntries> => {
  const comparator =
    comparators.find((comparator) => comparator.value === filter.sortKey)?.fn ?? comparePostEntriesById;

  return await getPostEntriesFromSource(
    () => published.getAllPosts(!filter.skipReferences),
    comparator('desc'),
    (post): post is Post =>
      Boolean(
        (typeof filter.type === 'undefined' || post.type === filter.type) &&
          (typeof filter.tag === 'undefined' || post.tags?.includes(filter.tag)) &&
          (typeof filter.author === 'undefined' || asArray(post.author).includes(filter.author)) &&
          (typeof filter.location === 'undefined' ||
            (post.location && isNestedLocation(post.location, filter.location))) &&
          (typeof filter.mark === 'undefined' || post.mark === filter.mark) &&
          (typeof filter.search === 'undefined' ||
            post.title?.toLocaleLowerCase()?.includes(filter.search.toLocaleLowerCase())),
      ),
  );
};

const getTags = async (): Promise<string[]> => {
  const result: Set<string> = new Set();
  const postEntries = await getPosts({ skipReferences: true });

  for (const [, post] of postEntries) {
    if (typeof post !== 'string') {
      post.tags?.forEach((tag) => result.add(tag));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getLocations = async (): Promise<string[]> => {
  const result: Set<string> = new Set();
  const { default: data } = await import('../../../../data/locations.yml');

  const locations = data as Location[];

  const postEntries = await getPosts({ skipReferences: true });

  for (const [, post] of postEntries) {
    if (typeof post !== 'string' && post.location) {
      locations
        .filter((location) => post.location && isNestedLocation(post.location, location.title))
        .forEach((location) => result.add(location.title));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getUsers = async (): Promise<string[]> => {
  const result: Set<string> = new Set();
  const postEntries = await getPosts({ skipReferences: true });

  for (const [, post] of postEntries) {
    if (typeof post !== 'string') {
      asArray(post.author).forEach((author) => result.add(author));
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

export const PublishedPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<Required<PublishedRouteParams>>();

  const postType = () => POST_TYPES.find((type) => type === searchParams.type);
  const postTag = () => searchParams.tag;
  const postLocation = () => searchParams.location;
  const postAuthor = () => searchParams.author;
  const postMark = () => POST_MARKS.find((mark) => mark === searchParams.mark);
  const searchTerm = () => searchParams.search;

  const setPostType = (type: PostType | undefined) => setSearchParams({ ...searchParams, type });
  const setPostTag = (tag: string | undefined) => setSearchParams({ ...searchParams, tag });
  const setPostLocation = (location: string | undefined) => setSearchParams({ ...searchParams, location });
  const setPostAuthor = (author: string | undefined) => setSearchParams({ ...searchParams, author });
  const setPostMark = (mark: PostMark | undefined) => setSearchParams({ ...searchParams, mark });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ ...searchParams, search });

  const [sortKey, setSortKey] = createSignal<ComparatorKey>('id');
  const [isSearching, setIsSearching] = createSignal(false);

  const postFilter = (): PostsFilter => ({
    skipReferences: sortKey() !== 'id',
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    search: searchTerm(),
    sortKey: sortKey(),
    author: postAuthor(),
    mark: postMark(),
  });

  const [posts] = createResource(postFilter, getPosts);
  const [tags] = createResource(getTags);
  const [locations] = createResource(getLocations);
  const [users] = createResource(getUsers);

  return (
    <Page status={posts.loading ? 'Loading...' : isSearching() ? 'Searching...' : undefined}>
      <>
        <form class={styles.filter}>
          <RadioGroup
            options={[{ value: undefined, label: 'All' }, ...POST_TYPES.map((value) => ({ value }))]}
            name="postType"
            value={postType()}
            onChange={setPostType}
          />
          <Select
            label="Location"
            options={[{ value: undefined, label: 'All' }, ...(locations()?.map((value) => ({ value })) ?? [])]}
            value={postLocation()}
            onChange={setPostLocation}
          />
          <Select
            label="Tag"
            options={[{ value: undefined, label: 'All' }, ...(tags()?.map((value) => ({ value })) ?? [])]}
            value={postTag()}
            onChange={setPostTag}
          />
          <Select
            label="Author"
            options={[
              { value: undefined, label: 'All' },
              ...(users()?.map((value) => ({ value, label: getUserName(value) })) ?? []),
            ]}
            value={postAuthor()}
            onChange={setPostAuthor}
          />
          <Select
            label="Editor's Mark"
            options={[{ value: undefined, label: 'All' }, ...POST_MARKS.map((value) => ({ value }))]}
            value={postMark()}
            onChange={setPostMark}
          />
          <Select
            label="Order By"
            options={comparators.map(({ value, label }) => ({ value, label }))}
            value={sortKey()}
            onChange={setSortKey}
          />
          <Input
            label="Search"
            value={searchTerm()}
            onChange={() => setIsSearching(true)}
            onDebouncedChange={(value) => {
              setSearchTerm(value);
              setIsSearching(false);
            }}
          />
        </form>

        <Divider />

        <Show when={!posts.loading}>
          <PostPreviews postEntries={posts() ?? []} managerName={published.name} />
        </Show>
      </>
    </Page>
  );
};

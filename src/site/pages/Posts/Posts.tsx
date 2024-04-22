import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import type { Location } from '../../../core/entities/location.js';
import { isNestedLocation } from '../../../core/entities/location.js';
import type { Post, PostEntries, PostEntry, PostType } from '../../../core/entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  comparePostEntriesByViews,
  POST_TYPES,
} from '../../../core/entities/post.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { getUserName } from '../../data-managers/users.js';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { Page } from '../../components/Page/Page.jsx';
import { PostPreview } from '../../components/PostPreview/PostPreview.jsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.jsx';
import { Select } from '../../components/Select/Select.jsx';
import styles from './Posts.module.css';

const postChunks = import.meta.glob('../../../../data/published/*.yml', {
  import: 'default',
  query: { transform: 'postInfo' },
});

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
  sortKey: ComparatorKey;
}

const getPosts = async (filter: PostsFilter): Promise<PostEntries> => {
  const result: Map<string, Post> = new Map();
  const references: Map<string, string> = new Map();

  for (const chunk of Object.values(postChunks)) {
    const entries = Object.entries((await chunk()) as Record<string, Post | string>);
    for (const [id, post] of entries) {
      if (typeof post === 'string') {
        references.set(id, post);
      } else {
        result.set(id, post);
      }
    }
  }

  // Resolve references
  if (!filter.skipReferences) {
    for (const [id, originalId] of references) {
      const ref = result.get(originalId);
      if (ref) {
        result.set(id, ref);
      }
    }
  }

  const comparator =
    comparators.find((comparator) => comparator.value === filter.sortKey)?.fn ?? comparePostEntriesById;

  return [...result.entries()]
    .filter(
      ([, post]) =>
        (typeof filter.type === 'undefined' || post.type === filter.type) &&
        (typeof filter.tag === 'undefined' || post.tags?.includes(filter.tag)) &&
        (typeof filter.author === 'undefined' || asArray(post.author).includes(filter.author)) &&
        (typeof filter.location === 'undefined' ||
          (post.location && isNestedLocation(post.location, filter.location))) &&
        (typeof filter.search === 'undefined' ||
          post.title?.toLocaleLowerCase()?.includes(filter.search.toLocaleLowerCase())),
    )
    .sort(comparator('desc'));
};

const getTags = async (): Promise<string[]> => {
  const result: Set<string> = new Set();

  for (const chunk of Object.values(postChunks)) {
    const posts = Object.values((await chunk()) as Record<string, Post | string>);
    for (const post of posts) {
      if (typeof post !== 'string') {
        post.tags?.forEach((tag) => result.add(tag));
      }
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getLocations = async (): Promise<string[]> => {
  const result: Set<string> = new Set();
  const { default: data } = await import('../../../../data/locations.yml');

  const locations = data as Location[];

  for (const chunk of Object.values(postChunks)) {
    const posts = Object.values((await chunk()) as Record<string, Post | string>);
    for (const post of posts) {
      if (typeof post !== 'string' && post.location) {
        locations
          .filter((location) => post.location && isNestedLocation(post.location, location.title))
          .forEach((location) => result.add(location.title));
      }
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const getUsers = async (): Promise<string[]> => {
  const result: Set<string> = new Set();

  for (const chunk of Object.values(postChunks)) {
    const posts = Object.values((await chunk()) as Record<string, Post | string>);
    for (const post of posts) {
      if (typeof post !== 'string') {
        asArray(post.author).forEach((author) => result.add(author));
      }
    }
  }

  return [...result].sort((a, b) => a.localeCompare(b));
};

const ListItem: Component<VirtualItemProps<PostEntry<Post>>> = (props) => {
  return (
    <div style={props.style} class={styles.listItem} tabIndex={props.tabIndex} role="listitem">
      <PostPreview post={props.item[1]} />
    </div>
  );
};

const calculateGridItemSize = (crossAxisSize: number) => {
  const maxWidth = 336;

  const count = Math.ceil(crossAxisSize / maxWidth);
  const width = Math.floor(crossAxisSize / count);

  return {
    width,
    height: width + 33,
  };
};

export const Posts: Component = () => {
  let targetVertical;
  const [postType, setPostType] = createSignal<PostType | undefined>();
  const [postTag, setPostTag] = createSignal<string | undefined>();
  const [postLocation, setPostLocation] = createSignal<string | undefined>();
  const [postAuthor, setPostAuthor] = createSignal<string | undefined>();
  const [searchTerm, setSearchTerm] = createSignal<string | undefined>();
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
          <div ref={targetVertical} class={styles.scrollContainer}>
            <VirtualContainer
              items={posts() ?? []}
              scrollTarget={targetVertical}
              // Calculate how many grid columns to show.
              crossAxisCount={(measurements) => Math.floor(measurements.container.cross / measurements.itemSize.cross)}
              // overscan={10}
              itemSize={calculateGridItemSize}
            >
              {ListItem}
            </VirtualContainer>
          </div>
        </Show>
      </>
    </Page>
  );
};

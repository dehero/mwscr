import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import { isNestedLocation } from '../../entities/location.js';
import type { Post, PostEntries, PostEntry, PostType } from '../../entities/post.js';
import {
  comparePostEntriesById,
  comparePostEntriesByLikes,
  comparePostEntriesByRating,
  comparePostEntriesByViews,
  POST_TYPES,
} from '../../entities/post.js';
import { getUserName } from '../../site-data-managers/users.js';
import { asArray } from '../../utils/common-utils.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Input } from '../Input/Input.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.jsx';
import { Select } from '../Select/Select.js';
import styles from './App.module.css';

const postChunks = import.meta.glob('../../../data/published/*.yml', { import: 'default' });

const comparators = [
  { value: 'id', label: 'ID', fn: comparePostEntriesById },
  { value: 'likes', label: 'Likes', fn: comparePostEntriesByLikes },
  { value: 'views', label: 'Views', fn: comparePostEntriesByViews },
  { value: 'rating', label: 'Rating', fn: comparePostEntriesByRating },
] as const;

type ComparatorKey = (typeof comparators)[number]['value'];

interface PostsFilter {
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
        references.set(post, id);
      } else {
        result.set(id, post);
      }
    }
  }

  // Resolve references
  for (const [id, post] of references) {
    const ref = result.get(post);
    if (ref) {
      result.set(id, ref);
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
  const { default: data } = await import('../../../data/locations.lst');

  const locations: string[] = data.split(/\r?\n/);

  for (const chunk of Object.values(postChunks)) {
    const posts = Object.values((await chunk()) as Record<string, Post | string>);
    for (const post of posts) {
      if (typeof post !== 'string' && post.location) {
        locations
          .filter((location) => post.location && isNestedLocation(post.location, location))
          .forEach((location) => result.add(location));
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

export const App: Component = () => {
  let targetVertical;
  const [postType, setPostType] = createSignal<PostType | undefined>();
  const [postTag, setPostTag] = createSignal<string | undefined>();
  const [postLocation, setPostLocation] = createSignal<string | undefined>();
  const [postAuthor, setPostAuthor] = createSignal<string | undefined>();
  const [searchTerm, setSearchTerm] = createSignal<string | undefined>();
  const [sortKey, setSortKey] = createSignal<ComparatorKey>('id');
  const [isSearching, setIsSearching] = createSignal(false);

  const postFilter = (): PostsFilter => ({
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
    <>
      <div class={styles.header}>
        <div class={styles.title}>Morrowind Screenshots</div>

        <Button
          // TODO: use github-issue-resolvers
          href="https://github.com/dehero/mwscr/issues/new?labels=proposal&template=proposal.yml"
          target="_blank"
        >
          Propose
        </Button>
      </div>

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

      <Show when={!posts.loading} fallback={isSearching() ? 'Searching...' : 'Loading...'}>
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
  );
};

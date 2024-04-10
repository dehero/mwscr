import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, createResource, createSignal, Show } from 'solid-js';
import { isNestedLocation } from '../../entities/location.js';
import type { Post, PostEntries, PostType } from '../../entities/post.js';
import { comparePostEntriesById, POST_TYPES } from '../../entities/post.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Input } from '../Input/Input.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.jsx';
import { Select } from '../Select/Select.js';
import styles from './App.module.css';

const postChunks = import.meta.glob('../../../data/published/*.yml', { import: 'default' });

interface PostsFilter {
  type?: PostType;
  tag?: string;
  location?: string; // | null;
  search?: string;
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

  return [...result.entries()]
    .filter(
      ([, post]) =>
        (typeof filter.type === 'undefined' || post.type === filter.type) &&
        (typeof filter.tag === 'undefined' || post.tags?.includes(filter.tag)) &&
        (typeof filter.location === 'undefined' ||
          (post.location && isNestedLocation(post.location, filter.location))) &&
        (typeof filter.search === 'undefined' ||
          post.title?.toLocaleLowerCase()?.includes(filter.search.toLocaleLowerCase())),
    )
    .sort(comparePostEntriesById('desc'));
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

const ListItem: Component<VirtualItemProps<[string, Post | string]>> = (props) => {
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
  const [searchTerm, setSearchTerm] = createSignal<string | undefined>();
  const [isSearching, setIsSearching] = createSignal(false);

  const postFilter = (): PostsFilter => ({
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    search: searchTerm(),
  });

  const [posts] = createResource(postFilter, getPosts);
  const [tags] = createResource(getTags);
  const [locations] = createResource(getLocations);

  const isLoading = () => isSearching() || posts.loading;

  return (
    <>
      <div class={styles.header}>
        <div class={styles.title}>Morrowind Screenshots</div>
        <Input
          value={searchTerm()}
          onChange={() => setIsSearching(true)}
          onDebouncedChange={(value) => {
            setSearchTerm(value);
            setIsSearching(false);
          }}
        />
        <Select
          options={[{ value: undefined, label: 'All' }, ...(locations()?.map((value) => ({ value })) ?? [])]}
          value={postLocation()}
          onChange={setPostLocation}
        />
        <Select
          options={[{ value: undefined, label: 'All' }, ...(tags()?.map((value) => ({ value })) ?? [])]}
          value={postTag()}
          onChange={setPostTag}
        />
        <RadioGroup
          options={[{ value: undefined, label: 'All' }, ...POST_TYPES.map((value) => ({ value }))]}
          name="postType"
          value={postType()}
          onChange={setPostType}
        />
        <Button
          // TODO: use github-issue-resolvers
          href="https://github.com/dehero/mwscr/issues/new?labels=proposal&template=proposal.yml"
          target="_blank"
        >
          Propose
        </Button>
      </div>

      <Divider />

      <Show when={!isLoading()} fallback={isSearching() ? 'Searching...' : 'Loading...'}>
        <div ref={targetVertical} class={styles.scrollContainer}>
          <VirtualContainer
            items={posts()}
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

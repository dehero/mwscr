import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import clsx from 'clsx';
import { type Component, createSignal, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { usePageContext } from 'vike-solid/usePageContext';
import type { PostMark, PostType, PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { boolToString, stringToBool } from '../../../core/utils/common-utils.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../utils/data-utils.js';
import { selectPostInfos, selectPostInfosResultToString, selectPostInfosSortOptions } from '../../utils/data-utils.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import frameStyles from '../Frame/Frame.module.css';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import type { SelectOption } from '../Select/Select.js';
import { Select } from '../Select/Select.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Toast } from '../Toaster/Toaster.js';
import styles from './PostsPage.module.css';

interface PostsPagePreset extends SelectOption<string | undefined> {
  searchParams: PostsPageSearchParams;
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
  original: undefined,
  search: undefined,
  sort: undefined,
};

const presets = [
  { value: undefined, label: 'All', searchParams: {} },
  {
    value: 'editors-choice',
    label: "Editor's Choice",
    searchParams: { sort: 'mark,desc', original: 'true' },
  },
  { value: 'shortlist', label: 'Shortlist', searchParams: { publishable: 'true' } },
  { value: 'requests', label: 'Requests', searchParams: { requested: 'true', original: 'true' } },
  { value: 'revisit', label: 'Revisit', searchParams: { mark: 'F' } },
  {
    value: 'unlocated',
    label: 'Unlocated',
    searchParams: { location: NONE_OPTION.value, original: 'true' },
  },
  { value: 'violations', label: 'Violations', searchParams: { violation: ANY_OPTION.value } },
] as const satisfies PostsPagePreset[];

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
  original?: string;
  search?: string;
  sort?: string;
}

type FilterKey = keyof Pick<
  PostsPageSearchParams,
  'type' | 'tag' | 'location' | 'author' | 'mark' | 'violation' | 'publishable' | 'requested' | 'original'
>;

export interface PostsPageInfo extends SiteRouteInfo {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
}

function findPreset(presets: PostsPagePreset[], searchParams: PostsPageSearchParams) {
  return presets.find(
    (preset) =>
      Object.keys(preset.searchParams).length === Object.keys(searchParams).length &&
      Object.entries(preset.searchParams).every(
        ([key, value]) => searchParams[key as keyof PostsPageSearchParams] === value,
      ),
  );
}

export interface PostsPageData {
  postInfos: PostInfo[];
  authorOptions: SelectOption<string>[];
  locationOptions: SelectOption<string>[];
  tagOptions: SelectOption<string>[];
}

export const PostsPage: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let postsRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const postsScrollTarget = () => (narrowScreen() ? containerRef : postsRef);

  const [searchParams, setSearchParams] = useSearchParams<PostsPageSearchParams>();

  const pageContext = usePageContext();
  const info = () => useRouteInfo<PostsPageInfo>(pageContext);

  const sortOptions = () =>
    selectPostInfosSortOptions.filter((item) => !info()?.sortKeys || info()?.sortKeys?.includes(item.value));
  const presetOptions = (): PostsPagePreset[] => {
    const allowedPresets: PostsPagePreset[] = presets.filter(
      (item) => !item.value || !info()?.presetKeys || info()?.presetKeys?.includes(item.value),
    );
    const currentPreset = findPreset(allowedPresets, searchParams);

    if (!currentPreset) {
      allowedPresets.push({ value: 'custom', label: 'Custom Selection', searchParams });
    }

    return allowedPresets;
  };

  const postRequested = () => stringToBool(searchParams.requested);
  const postOriginal = () => stringToBool(searchParams.original);
  const postPublishable = () => stringToBool(searchParams.publishable);
  const postType = () => POST_TYPES.find((type) => type === searchParams.type);
  const postTag = () => searchParams.tag;
  const postLocation = () => searchParams.location;
  const postAuthor = () => searchParams.author;
  const postMark = () => POST_MARKS.find((mark) => mark === searchParams.mark);
  const postViolation = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...Object.keys(POST_VIOLATIONS)].find(
      (violation) => violation === searchParams.violation,
    ) as SelectPostInfosParams['violation'];
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'id';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;
  const preset = () => findPreset(presetOptions(), searchParams)?.value;

  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });
  const setPostRequested = (requested: boolean | undefined) => setSearchParams({ requested });
  const setPostOriginal = (original: boolean | undefined) => setSearchParams({ original });
  const setPostPublishable = (publishable: boolean | undefined) => setSearchParams({ publishable });
  const setPostType = (type: PostType | undefined) => setSearchParams({ type });
  const setPostTag = (tag: string | undefined) => setSearchParams({ tag });
  const setPostLocation = (location: string | undefined) => setSearchParams({ location });
  const setPostAuthor = (author: string | undefined) => setSearchParams({ author });
  const setPostMark = (mark: PostMark | undefined) => setSearchParams({ mark });
  const setPostViolation = (violation: ReturnType<typeof postViolation>) => setSearchParams({ violation });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: SelectPostInfosSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });

  const [isSearching, setIsSearching] = createSignal(false);
  const [expandParametersOnNarrowScreen, setExpandParamatersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const selectParams = (): SelectPostInfosParams => ({
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    author: postAuthor(),
    mark: postMark(),
    violation: postViolation(),
    requested: postRequested(),
    original: postOriginal(),
    publishable: postPublishable(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const { postInfos, tagOptions, locationOptions, authorOptions } = useData<PostsPageData>();

  const filteredPostInfos = () => selectPostInfos(postInfos, selectParams());

  return (
    <main class={clsx(frameStyles.thin, styles.container)} ref={containerRef}>
      <Frame variant="thin" component="form" class={styles.parameters}>
        <fieldset class={styles.presets}>
          <Select options={presetOptions()} value={preset()} onChange={setPreset} />
          <Button
            onClick={(e) => {
              e.preventDefault();
              setPreset(undefined);
            }}
          >
            Reset
          </Button>
          <Show when={narrowScreen()}>
            <Spacer />
            <Checkbox
              name="showParameters"
              value={expandParametersOnNarrowScreen()}
              onChange={setExpandParamatersOnNarrowScreen}
              trueLabel="Collapse"
              falseLabel="Expand"
            />
          </Show>
        </fieldset>

        <Show when={!narrowScreen() || expandParametersOnNarrowScreen()}>
          <Divider />

          <Show when={!info()?.filters || info()?.filters?.includes('original')}>
            <Label label="Original" component="div" vertical>
              <RadioGroup
                name="original"
                options={[ALL_OPTION, { value: 'true', label: 'Originals' }, { value: 'false', label: 'Reposts' }]}
                value={boolToString(postOriginal())}
                onChange={(value) => setPostOriginal(stringToBool(value))}
              />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('publishable')}>
            <Label label="Publishable" component="div" vertical>
              <RadioGroup
                name="publishable"
                options={[ALL_OPTION, { value: 'true', label: 'Shortlist' }, { value: 'false', label: 'Drafts' }]}
                value={boolToString(postPublishable())}
                onChange={(value) => setPostPublishable(stringToBool(value))}
              />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('requested')}>
            <Label label="Request" component="div" vertical>
              <RadioGroup
                name="requested"
                options={[ALL_OPTION, { value: 'true', label: 'Requested' }, { value: 'false', label: 'Unprompted' }]}
                value={boolToString(postRequested())}
                onChange={(value) => setPostRequested(stringToBool(value))}
              />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('type')}>
            <Label label="Type" vertical>
              <Select
                name="type"
                options={[ALL_OPTION, ...POST_TYPES.map((value) => ({ value }))]}
                value={postType()}
                onChange={setPostType}
              />
            </Label>
          </Show>

          <Label label="Search in Title or Description" vertical>
            <fieldset class={styles.fieldset}>
              <Input
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

              <Toast message="Searching Posts" show={isSearching()} loading />
            </fieldset>
          </Label>

          <Show when={!info()?.filters || info()?.filters?.includes('location')}>
            <Label label="Location" vertical class={styles.label}>
              <div class={styles.selectWrapper}>
                <Select
                  name="location"
                  options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...locationOptions]}
                  value={postLocation()}
                  onChange={setPostLocation}
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('tag')}>
            <Label label="Tag" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="tag"
                  options={[ALL_OPTION, ...tagOptions]}
                  value={postTag()}
                  onChange={setPostTag}
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('author')}>
            <Label label="Author" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="author"
                  options={[ALL_OPTION, ...authorOptions]}
                  value={postAuthor()}
                  onChange={setPostAuthor}
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('mark')}>
            <Label label="Editor's Mark" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="mark"
                  options={[ALL_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
                  value={postMark()}
                  onChange={setPostMark}
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('violation')}>
            <Label label="Violation" vertical>
              <div class={styles.selectWrapper}>
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
                  class={styles.select}
                />
              </div>
            </Label>
          </Show>

          <Show when={sortOptions().length > 0}>
            <Label label="Order By" vertical>
              <fieldset class={styles.fieldset}>
                <Select options={sortOptions()} value={sortKey()} onChange={setSortKey} />
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
            </Label>
          </Show>
        </Show>
      </Frame>

      <Frame variant="thin" class={styles.posts} ref={postsRef}>
        <PostPreviews
          scrollTarget={postsScrollTarget()}
          postInfos={filteredPostInfos()}
          label={selectPostInfosResultToString(filteredPostInfos().length, selectParams())}
        />
      </Frame>
    </main>
  );
};

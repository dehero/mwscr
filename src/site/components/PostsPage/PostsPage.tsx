import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { type Component, createSignal, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { usePageContext } from 'vike-solid/usePageContext';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../../core/entities/option.js';
import type { PostMark, PostType, PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { DateRange, SortDirection } from '../../../core/utils/common-types.js';
import { boolToString, isObjectEqual, stringToBool } from '../../../core/utils/common-utils.js';
import { dateRangeToString, stringToDateRange } from '../../../core/utils/date-utils.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../data-utils/post-infos.js';
import {
  selectPostInfos,
  selectPostInfosResultToString,
  selectPostInfosSortOptions,
} from '../../data-utils/post-infos.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostPreviews } from '../PostPreviews/PostPreviews.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { Select } from '../Select/Select.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Toast } from '../Toaster/Toaster.js';
import styles from './PostsPage.module.css';

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

const emptySearchParams: PostsPageSearchParams = {
  type: undefined,
  tag: undefined,
  location: undefined,
  author: undefined,
  requester: undefined,
  mark: undefined,
  violation: undefined,
  publishable: undefined,
  original: undefined,
  search: undefined,
  sort: undefined,
  date: undefined,
};

interface PostsPagePreset extends Option {
  searchParams: PostsPageSearchParams;
}

const presets = [
  { value: undefined, label: 'All', searchParams: {} },
  {
    value: 'editors-choice',
    label: "Editor's Choice",
    searchParams: { sort: 'mark,desc', original: 'true' },
  },
  { value: 'shortlist', label: 'Shortlist', searchParams: { publishable: 'true' } },
  { value: 'requests', label: 'Requests', searchParams: { requester: 'any', original: 'true' } },
  { value: 'revisit', label: 'Revisit', searchParams: { mark: 'F' } },
  {
    value: 'unlocated',
    label: 'Unlocated',
    searchParams: { location: NONE_OPTION.value, original: 'true' },
  },
  { value: 'violations', label: 'Violations', searchParams: { violation: ANY_OPTION.value } },
] as const satisfies PostsPagePreset[];

type PresetKey = (typeof presets)[number]['value'];

type FilterKey = keyof Pick<
  PostsPageSearchParams,
  'type' | 'tag' | 'location' | 'author' | 'mark' | 'violation' | 'publishable' | 'original' | 'requester' | 'date'
>;

export interface PostsPageInfo extends SiteRouteInfo {
  presetKeys?: PresetKey extends undefined ? never : PresetKey[];
  filters?: FilterKey[];
  sortKeys?: SelectPostInfosSortKey[];
}

export interface PostsPageData {
  postInfos: PostInfo[];
  authorOptions: Option[];
  requesterOptions: Option[];
  locationOptions: Option[];
  tagOptions: Option[];
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
    const options: PostsPagePreset[] = presets.filter(
      (item) => !item.value || !info()?.presetKeys || info()?.presetKeys?.includes(item.value),
    );
    const currentPreset = options.find((preset) => isObjectEqual(preset.searchParams, searchParams));

    if (!currentPreset) {
      options.push({ value: 'custom', label: 'Custom Selection', searchParams });
    }

    return options;
  };

  const postOriginal = () => stringToBool(searchParams.original);
  const postPublishable = () => stringToBool(searchParams.publishable);
  const postType = () => POST_TYPES.find((info) => info.id === searchParams.type)?.id;
  const postTag = () => searchParams.tag;
  const postLocation = () => searchParams.location;
  const postAuthor = () => searchParams.author;
  const postRequester = () => searchParams.requester;
  const postMark = () => POST_MARKS.find((mark) => mark === searchParams.mark);
  const postViolation = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...Object.keys(POST_VIOLATIONS)].find(
      (violation) => violation === searchParams.violation,
    ) as SelectPostInfosParams['violation'];
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'date';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams))?.value;
  const date = (): DateRange | undefined => (searchParams.date ? stringToDateRange(searchParams.date) : undefined);

  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });
  const setPostOriginal = (original: boolean | undefined) => setSearchParams({ original });
  const setPostPublishable = (publishable: boolean | undefined) => setSearchParams({ publishable });
  const setPostType = (type: PostType | undefined) => setSearchParams({ type });
  const setPostTag = (tag: string | undefined) => setSearchParams({ tag });
  const setPostLocation = (location: string | undefined) => setSearchParams({ location });
  const setPostAuthor = (author: string | undefined) => setSearchParams({ author });
  const setPostRequester = (requester: string | undefined) => setSearchParams({ requester });
  const setPostMark = (mark: PostMark | undefined) => setSearchParams({ mark });
  const setPostViolation = (violation: ReturnType<typeof postViolation>) => setSearchParams({ violation });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: SelectPostInfosSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });
  const setDate = (date: DateRange | undefined) => {
    setSearchParams({ date: date ? dateRangeToString(date) : undefined });
  };

  const [isSearching, setIsSearching] = createSignal(false);
  const [expandParametersOnNarrowScreen, setExpandParamatersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'posts.expandParametersOnNarrowScreen',
  });

  const selectParams = (): SelectPostInfosParams => ({
    type: postType(),
    location: postLocation(),
    tag: postTag(),
    author: postAuthor(),
    requester: postRequester(),
    mark: postMark(),
    violation: postViolation(),
    original: postOriginal(),
    publishable: postPublishable(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
    date: date(),
  });

  const { postInfos, tagOptions, locationOptions, authorOptions, requesterOptions } = useData<PostsPageData>();

  const selectedPostInfos = () => selectPostInfos(postInfos, selectParams());

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
      <Frame component="form" class={styles.parameters}>
        <fieldset class={styles.presets}>
          <Select options={presetOptions()} value={preset()} onChange={setPreset} />
          <Button
            onClick={(e: Event) => {
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
            <Label label="Originality" component="div" vertical>
              <RadioGroup
                name="original"
                options={[ALL_OPTION, { value: 'true', label: 'Originals' }, { value: 'false', label: 'Reposts' }]}
                value={boolToString(postOriginal())}
                onChange={(value) => setPostOriginal(stringToBool(value))}
              />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('publishable')}>
            <Label label="Publishability" component="div" vertical>
              <RadioGroup
                name="publishable"
                options={[ALL_OPTION, { value: 'true', label: 'Shortlist' }, { value: 'false', label: 'Drafts' }]}
                value={boolToString(postPublishable())}
                onChange={(value) => setPostPublishable(stringToBool(value))}
              />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('date')}>
            <Label label="Date" vertical>
              <DatePicker value={date()} onChange={setDate} period emptyLabel="All" />
            </Label>
          </Show>

          <Show when={!info()?.filters || info()?.filters?.includes('type')}>
            <Label label="Type" vertical>
              <Select
                name="type"
                options={[ALL_OPTION, ...POST_TYPES.map((info) => ({ value: info.id }))]}
                value={postType()}
                onChange={setPostType}
              />
            </Label>
          </Show>

          <Label label="Search by Title or Description" vertical>
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
                onClick={(e: Event) => {
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

          <Show when={!info()?.filters || info()?.filters?.includes('requester')}>
            <Label label="Requester" vertical>
              <div class={styles.selectWrapper}>
                <Select
                  name="requester"
                  options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...requesterOptions]}
                  value={postRequester()}
                  onChange={setPostRequester}
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
            <Label label="Sort By" vertical>
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
          postInfos={selectedPostInfos()}
          label={selectPostInfosResultToString(selectedPostInfos().length, selectParams())}
        />
      </Frame>
    </Frame>
  );
};

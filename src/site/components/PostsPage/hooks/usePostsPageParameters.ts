import type { Option } from '../../../../core/entities/option.js';
import { ANY_OPTION, NONE_OPTION } from '../../../../core/entities/option.js';
import type { PostMark, PostType } from '../../../../core/entities/post.js';
import { POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../../core/entities/post.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../../../core/entities/post-info.js';
import { selectPostInfosSortOptions } from '../../../../core/entities/post-info.js';
import type { SiteRouteInfo } from '../../../../core/entities/site-route.js';
import type { DateRange, SortDirection } from '../../../../core/utils/common-types.js';
import { isObjectEqual, stringToBool } from '../../../../core/utils/common-utils.js';
import { dateRangeToString, stringToDateRange } from '../../../../core/utils/date-utils.js';
import { useSearchParams } from '../../../hooks/useSearchParams.js';
import type { PostsRouteParams } from '../../../routes/posts-route.js';
import type { PostsPageInfo, PostsPageSearchParams } from '../PostsPage.jsx';

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

export type PresetKey = (typeof presets)[number]['value'];

export type FilterKey = keyof Pick<
  PostsPageSearchParams,
  'type' | 'tag' | 'location' | 'author' | 'mark' | 'violation' | 'publishable' | 'original' | 'requester' | 'date'
>;

export function usePostsPageParameters(routeInfo: SiteRouteInfo<PostsRouteParams, unknown, PostsPageInfo>) {
  const { meta } = routeInfo;
  const [searchParams, setSearchParams] = useSearchParams<PostsPageSearchParams>();

  const sortOptions = () =>
    selectPostInfosSortOptions.filter((item) => !meta().sortKeys || meta().sortKeys?.includes(item.value));
  const presetOptions = (): PostsPagePreset[] => {
    const options: PostsPagePreset[] = presets.filter(
      (item) => !item.value || !meta().presetKeys || meta().presetKeys?.includes(item.value),
    );
    const currentPreset = options.find((preset) => isObjectEqual(preset.searchParams, searchParams));

    if (!currentPreset) {
      options.push({ value: 'custom', label: 'Custom Selection', searchParams: searchParams() });
    }

    return options;
  };

  const original = () => stringToBool(searchParams().original);
  const publishable = () => stringToBool(searchParams().publishable);
  const type = () => POST_TYPES.find((info) => info.id === searchParams().type)?.id;
  const tag = () => searchParams().tag;
  const location = () => searchParams().location;
  const author = () => searchParams().author;
  const requester = () => searchParams().requester;
  const mark = () => POST_MARKS.find((info) => info.id === searchParams().mark)?.id;
  const violation = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...Object.keys(POST_VIOLATIONS)].find(
      (violation) => violation === searchParams().violation,
    ) as SelectPostInfosParams['violation'];
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams().sort?.split(',')[0])?.value || 'date';
  const sortDirection = () => (searchParams().sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const search = () => searchParams().search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams))?.value;
  const date = (): DateRange | undefined => (searchParams().date ? stringToDateRange(searchParams().date!) : undefined);

  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });
  const setOriginal = (original: boolean | undefined) => setSearchParams({ original });
  const setPublishable = (publishable: boolean | undefined) => setSearchParams({ publishable });
  const setType = (type: PostType | undefined) => setSearchParams({ type });
  const setTag = (tag: string | undefined) => setSearchParams({ tag });
  const setLocation = (location: string | undefined) =>
    setSearchParams({ location, original: Boolean(location) || undefined });
  const setAuthor = (author: string | undefined) => setSearchParams({ author });
  const setRequester = (requester: string | undefined) => setSearchParams({ requester });
  const setMark = (mark: PostMark | undefined) => setSearchParams({ mark });
  const setViolation = (violation: SelectPostInfosParams['violation'] | undefined) => setSearchParams({ violation });
  const setSearch = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: SelectPostInfosSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });
  const setDate = (date: DateRange | undefined) => {
    setSearchParams({ date: date ? dateRangeToString(date) : undefined });
  };

  return {
    sortOptions,
    presetOptions,
    preset,
    original,
    publishable,
    type,
    tag,
    location,
    author,
    requester,
    mark,
    violation,
    sortKey,
    sortDirection,
    search,
    date,
    setPreset,
    setOriginal,
    setPublishable,
    setType,
    setTag,
    setLocation,
    setAuthor,
    setRequester,
    setMark,
    setViolation,
    setSearch,
    setSortKey,
    setSortDirection,
    setDate,
  };
}

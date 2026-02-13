import { ListReaderItemStatus } from '../../../../core/entities/list-manager.js';
import type { Option } from '../../../../core/entities/option.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../../../core/entities/option.js';
import {
  PostAddon,
  PostMark,
  PostPlacement,
  PostType,
  postTypeDescriptors,
  PostViolation,
} from '../../../../core/entities/post.js';
import type { SelectPostInfosParams, SelectPostInfosSortKey } from '../../../../core/entities/post-info.js';
import { selectPostInfosSortOptions } from '../../../../core/entities/post-info.js';
import { safeParseSchema } from '../../../../core/entities/schema.js';
import type { SiteRouteInfo } from '../../../../core/entities/site-route.js';
import type { DateRange, SortDirection } from '../../../../core/utils/common-types.js';
import { stringToBool } from '../../../../core/utils/common-utils.js';
import { dateRangeToString, stringToDateRange } from '../../../../core/utils/date-utils.js';
import { isObjectEqual } from '../../../../core/utils/object-utils.js';
import { useSearchParams } from '../../../hooks/useSearchParams.js';
import type { PostsPageParams, PostsPageSearchParams } from '../PostsPage.data.js';
import type { PostsPageInfo } from '../PostsPage.jsx';

const emptySearchParams: PostsPageSearchParams = {
  type: undefined,
  tag: undefined,
  location: undefined,
  placement: undefined,
  author: undefined,
  locator: undefined,
  requester: undefined,
  mark: undefined,
  violation: undefined,
  publishable: undefined,
  original: undefined,
  official: undefined,
  search: undefined,
  sort: undefined,
  date: undefined,
  status: undefined,
  addon: undefined,
};

interface PostsPagePreset extends Option {
  searchParams: PostsPageSearchParams;
}

const presets = [
  { value: undefined, label: 'All Posts', searchParams: {} },
  {
    value: 'editors-choice',
    label: "Editor's Choice",
    searchParams: { sort: 'mark,desc', original: 'true' },
  },
  {
    value: 'edits',
    label: 'Edits',
    searchParams: { status: 'any' },
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
  | 'type'
  | 'tag'
  | 'location'
  | 'author'
  | 'locator'
  | 'mark'
  | 'violation'
  | 'publishable'
  | 'original'
  | 'requester'
  | 'date'
  | 'status'
  | 'placement'
  | 'addon'
  | 'official'
>;

export function usePostsPageParameters(routeInfo: SiteRouteInfo<PostsPageParams, unknown, PostsPageInfo>) {
  const { meta } = routeInfo;
  const [searchParams, setSearchParams] = useSearchParams<PostsPageSearchParams>();

  const activeCount = () => Object.keys(searchParams()).length;

  const sortOptions = () =>
    selectPostInfosSortOptions.filter((item) => !meta().sortKeys || meta().sortKeys?.includes(item.value));
  const presetOptions = (): PostsPagePreset[] => {
    let options: PostsPagePreset[] = presets.filter(
      (item) => !item.value || !meta().presetKeys || meta().presetKeys?.includes(item.value),
    );
    const currentParams = searchParams();
    const currentPreset = options.find((preset) => isObjectEqual(preset.searchParams, currentParams));

    if (!currentPreset) {
      options = [
        ...options,
        { value: 'custom', label: `Custom Options (${activeCount()})`, searchParams: currentParams },
      ];
    }

    return options;
  };
  const typeOptions = () => [
    ALL_OPTION,
    ...PostType.options
      .filter((item) => !meta().typeKeys || meta().typeKeys?.includes(item))
      .map((value) => ({ value, label: postTypeDescriptors[value].title }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const original = () => stringToBool(searchParams().original);
  const official = () => stringToBool(searchParams().official);
  const publishable = () => stringToBool(searchParams().publishable);
  const type = () => safeParseSchema(PostType, searchParams().type);
  const tag = () => searchParams().tag;
  const location = () => searchParams().location;
  const author = () => searchParams().author;
  const locator = () => searchParams().locator;
  const requester = () => searchParams().requester;
  const mark = () => safeParseSchema(PostMark, searchParams().mark);
  const violation = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...PostViolation.options].find(
      (violation) => violation === searchParams().violation,
    ) as SelectPostInfosParams['violation'];
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams().sort?.split(',')[0])?.value || 'date';
  const sortDirection = () => (searchParams().sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const search = () => searchParams().search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams()))?.value;

  const date = (): DateRange | undefined => (searchParams().date ? stringToDateRange(searchParams().date!) : undefined);
  const status = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...ListReaderItemStatus.options].find(
      (status) => status === searchParams().status,
    ) as SelectPostInfosParams['status'];
  const placement = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...PostPlacement.options].find(
      (placement) => placement === searchParams().placement,
    ) as SelectPostInfosParams['placement'];
  const addon = () =>
    [ANY_OPTION.value, NONE_OPTION.value, ...PostAddon.options].find(
      (addon) => addon === searchParams().addon,
    ) as SelectPostInfosParams['addon'];

  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });
  const setOriginal = (original: boolean | undefined) => setSearchParams({ original });
  const setOfficial = (official: boolean | undefined) => setSearchParams({ official });
  const setPublishable = (publishable: boolean | undefined) => setSearchParams({ publishable });
  const setType = (type: PostType | undefined) => setSearchParams({ type });
  const setTag = (tag: string | undefined) => setSearchParams({ tag, original: Boolean(tag) || undefined });
  const setLocation = (location: string | undefined) =>
    setSearchParams({ location, original: Boolean(location) || undefined });
  const setAuthor = (author: string | undefined) => setSearchParams({ author });
  const setLocator = (locator: string | undefined) => setSearchParams({ locator });
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
  const setStatus = (status: SelectPostInfosParams['status'] | undefined) => setSearchParams({ status });
  const setPlacement = (placement: SelectPostInfosParams['placement'] | undefined) => setSearchParams({ placement });
  const setAddon = (addon: SelectPostInfosParams['addon'] | undefined) => setSearchParams({ addon });

  return {
    sortOptions,
    presetOptions,
    typeOptions,
    preset,
    original,
    official,
    publishable,
    type,
    tag,
    location,
    author,
    locator,
    requester,
    mark,
    violation,
    sortKey,
    sortDirection,
    search,
    date,
    status,
    placement,
    addon,
    setPreset,
    setOfficial,
    setOriginal,
    setPublishable,
    setType,
    setTag,
    setLocation,
    setAuthor,
    setLocator,
    setRequester,
    setMark,
    setViolation,
    setSearch,
    setSortKey,
    setSortDirection,
    setDate,
    setStatus,
    setPlacement,
    setAddon,
    activeCount,
  };
}

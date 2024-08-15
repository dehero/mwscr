import type { Option } from '../../core/entities/option.js';
import type { UserRole } from '../../core/entities/user.js';
import type { UserInfo, UserInfoComparator } from '../../core/entities/user-info.js';
import { compareUserInfosByContribution, compareUserInfosById } from '../../core/entities/user-info.js';
import type { SortDirection } from '../../core/utils/common-types.js';
import { getSearchTokens, search } from '../../core/utils/common-utils.js';

export interface SelectUserInfoSortOption extends Option {
  fn: (direction: SortDirection) => UserInfoComparator;
}

export interface SelectUserInfosParams {
  role?: UserRole;
  search?: string;
  sortKey: SelectUserInfosSortKey;
  sortDirection: SortDirection;
}

export const selectUserInfosSortOptions = [
  { value: 'contribution', label: 'Contrbution', fn: compareUserInfosByContribution },
  { value: 'id', label: 'ID', fn: compareUserInfosById },
] as const satisfies SelectUserInfoSortOption[];

export type SelectUserInfosSortKey = (typeof selectUserInfosSortOptions)[number]['value'];

export function selectUserInfos(userInfos: UserInfo[], params: SelectUserInfosParams) {
  const comparator =
    selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey)?.fn ?? compareUserInfosById;
  const searchTokens = getSearchTokens(params.search);

  return userInfos
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        search(searchTokens, [info.title, info.id]),
    )
    .sort(comparator(params.sortDirection));
}

export function selectUserInfosResultToString(count: number, params: SelectUserInfosParams) {
  const result: string[] = [count.toString()];
  const sortOption = selectUserInfosSortOptions.find((comparator) => comparator.value === params.sortKey);

  if (params.role) {
    result.push(`${params.role}${count !== 1 ? 's' : ''}`);
  } else {
    result.push(`user${count !== 1 ? 's' : ''}`);
  }

  if (params.search) {
    result.push(`with "${params.search}" in name or ID`);
  }

  if (sortOption) {
    result.push(`sorted by "${sortOption.label}" ${params.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }

  return result.join(' ');
}

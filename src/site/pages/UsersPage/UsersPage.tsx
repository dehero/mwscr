import { useCurrentMatches, useSearchParams } from '@solidjs/router';
import { type Component, createResource, createSignal, For, Show } from 'solid-js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import type { UserRole } from '../../../core/entities/user.js';
import {
  compareUserInfosByContribution,
  compareUserInfosById,
  createUserInfo,
  USER_ROLES,
} from '../../../core/entities/user.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { Button } from '../../components/Button/Button.js';
import { Divider } from '../../components/Divider/Divider.js';
import { Input } from '../../components/Input/Input.js';
import { Label } from '../../components/Label/Label.js';
import { Page } from '../../components/Page/Page.js';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.js';
import { Select } from '../../components/Select/Select.js';
import { UserPreview } from '../../components/UserPreview/UserPreview.js';
import { inbox, published, trash } from '../../data-managers/posts.js';
import { users } from '../../data-managers/users.js';
import { userRoute } from '../../routes/user-route.js';
import { ALL_OPTION } from '../../utils/ui-constants.js';
import styles from './UsersPage.module.css';

const comparators = [
  { value: 'id', label: 'ID', fn: compareUserInfosById },
  { value: 'contribution', label: 'Contrbution', fn: compareUserInfosByContribution },
] as const;

export type UsersPageSortKey = (typeof comparators)[number]['value'];

export interface UsersPageSearchParams {
  role?: UserRole;
  search?: string;
  sort?: `${UsersPageSortKey},${SortDirection}`;
}

interface GetUserInfosParams {
  role?: UserRole;
  search?: string;
  sortKey: UsersPageSortKey;
  sortDirection: SortDirection;
}

async function getUserInfos(params: GetUserInfosParams) {
  const comparator = comparators.find((comparator) => comparator.value === params.sortKey)?.fn ?? compareUserInfosById;

  return (
    await Promise.all(
      (await users.getAllEntries()).map((userEntry) => createUserInfo(userEntry, published, inbox, trash)),
    )
  )
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        (typeof params.search === 'undefined' ||
          info.title.toLocaleLowerCase().includes(params.search.toLocaleLowerCase())),
    )
    .sort(comparator);
}

export const UsersPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<Required<UsersPageSearchParams>>();
  const routeMatches = useCurrentMatches();
  const info = () => routeMatches[0]?.route.info as SiteRouteInfo;

  const sortOptions = () => comparators.map(({ value, label }) => ({ value, label }));

  const userRole = () => USER_ROLES.find((type) => type === searchParams.role);
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'contribution';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;

  const setUserRole = (role: UserRole | undefined) => setSearchParams({ role });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: UsersPageSortKey | undefined) => setSearchParams({ sort: `${key},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction}` });

  const [isSearching, setIsSearching] = createSignal(false);

  const getUserInfoParams = (): GetUserInfosParams => ({
    role: userRole(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const [userInfos] = createResource(getUserInfoParams, getUserInfos);

  return (
    <Page status={userInfos.loading ? 'Loading...' : isSearching() ? 'Searching...' : undefined} title={info().title}>
      <div class={styles.header}>
        <RadioGroup
          name="role"
          options={[ALL_OPTION, ...USER_ROLES.map((value) => ({ value }))]}
          value={userRole()}
          onChange={setUserRole}
        />

        <fieldset class={styles.fieldset}>
          <Label label="Order By">
            <Select options={sortOptions()} value={sortKey()} onChange={setSortKey} />
          </Label>
          <Select
            options={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' },
            ]}
            value={sortDirection()}
            onChange={setSortDirection}
          />
        </fieldset>

        <fieldset class={styles.fieldset}>
          <Label label="Search">
            <Input
              name="search"
              value={searchTerm()}
              onChange={() => setIsSearching(true)}
              onDebouncedChange={(value) => {
                setSearchTerm(value);
                setIsSearching(false);
              }}
            />
          </Label>
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
      </div>

      <Divider />

      <Show when={!userInfos.loading}>
        <div class={styles.container}>
          <For each={userInfos() ?? []}>
            {(info) => <UserPreview userInfo={info} url={userRoute.createUrl({ id: info.id })} />}
          </For>
        </div>
      </Show>
    </Page>
  );
};

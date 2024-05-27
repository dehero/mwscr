import { type Component, createSignal, For } from 'solid-js';
import { useData } from 'vike-solid/useData';
import type { UserInfo, UserRole } from '../../../core/entities/user.js';
import { compareUserInfosByContribution, compareUserInfosById, USER_ROLES } from '../../../core/entities/user.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import { userRoute } from '../../routes/user-route.js';
import { ALL_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.js';
import { Divider } from '../Divider/Divider.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { Select } from '../Select/Select.js';
import { Toast } from '../Toaster/Toaster.js';
import { UserPreview } from '../UserPreview/UserPreview.js';
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

function getUserInfos(params: GetUserInfosParams) {
  const comparator = comparators.find((comparator) => comparator.value === params.sortKey)?.fn ?? compareUserInfosById;
  const data = useData<UserInfo[]>();

  return data
    .filter(
      (info) =>
        (typeof params.role === 'undefined' || info.roles.includes(params.role)) &&
        (typeof params.search === 'undefined' ||
          info.title.toLocaleLowerCase().includes(params.search.toLocaleLowerCase())),
    )
    .sort(comparator);
}

export const UsersPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<UsersPageSearchParams>();

  const sortOptions = () => comparators.map(({ value, label }) => ({ value, label }));

  const userRole = () => USER_ROLES.find((type) => type === searchParams.role);
  const sortKey = () =>
    sortOptions().find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value || 'contribution';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;

  const setUserRole = (role: UserRole | undefined) => setSearchParams({ role });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: UsersPageSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });

  const [isSearching, setIsSearching] = createSignal(false);

  const getUserInfoParams = (): GetUserInfosParams => ({
    role: userRole(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const userInfos = () => getUserInfos(getUserInfoParams());

  return (
    <>
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

          <Toast message="Searching..." show={isSearching()} />
        </fieldset>
      </div>

      <Divider />

      <div class={styles.container}>
        <For each={userInfos()}>
          {(info) => <UserPreview userInfo={info} url={userRoute.createUrl({ id: info.id })} />}
        </For>
      </div>
    </>
  );
};

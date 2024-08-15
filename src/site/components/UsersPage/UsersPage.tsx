import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { type Component, createSignal, For, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION } from '../../../core/entities/option.js';
import type { UserRole } from '../../../core/entities/user.js';
import { USER_ROLES } from '../../../core/entities/user.js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { isObjectEqual } from '../../../core/utils/common-utils.js';
import {
  selectUserInfos,
  type SelectUserInfosParams,
  selectUserInfosResultToString,
  type SelectUserInfosSortKey,
  selectUserInfosSortOptions,
} from '../../data-utils/user-infos.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { Select } from '../Select/Select.js';
import { Spacer } from '../Spacer/Spacer.jsx';
import { Toast } from '../Toaster/Toaster.js';
import { UserPreview } from '../UserPreview/UserPreview.js';
import styles from './UsersPage.module.css';

export interface UsersPageSearchParams {
  role?: UserRole;
  search?: string;
  sort?: `${SelectUserInfosSortKey},${SortDirection}`;
}

const emptySearchParams: UsersPageSearchParams = {
  role: undefined,
  search: undefined,
  sort: undefined,
};

interface UsersPagePreset extends Option {
  searchParams: UsersPageSearchParams;
}

const presets = [
  { value: undefined, label: 'All', searchParams: {} },
  {
    value: 'authors',
    label: 'Authors',
    searchParams: { sort: 'contribution,desc', role: 'author' },
  },
  {
    value: 'requesters',
    label: 'Requesters',
    searchParams: { sort: 'contribution,desc', role: 'requester' },
  },
] as const satisfies UsersPagePreset[];

export interface UsersPageData {
  userInfos: UserInfo[];
}

export const UsersPage: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<UsersPageSearchParams>();
  const { userInfos } = useData<UsersPageData>();
  const narrowScreen = createMediaQuery('(max-width: 811px)');

  const presetOptions = (): UsersPagePreset[] => {
    const options: UsersPagePreset[] = [...presets];
    const currentPreset = presets.find((preset) => isObjectEqual(preset.searchParams, searchParams));

    if (!currentPreset) {
      options.push({ value: 'custom', label: 'Custom Selection', searchParams });
    }

    return options;
  };

  const userRole = () => USER_ROLES.find((type) => type === searchParams.role);
  const sortKey = () =>
    selectUserInfosSortOptions.find((sortOption) => sortOption.value === searchParams.sort?.split(',')[0])?.value ||
    'contribution';
  const sortDirection = () => (searchParams.sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams.search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams))?.value;

  const setUserRole = (role: UserRole | undefined) => setSearchParams({ role });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: SelectUserInfosSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });
  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });

  const [isSearching, setIsSearching] = createSignal(false);
  const [expandParametersOnNarrowScreen, setExpandParamatersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'users.expandParametersOnNarrowScreen',
  });

  const selectParams = (): SelectUserInfosParams => ({
    role: userRole(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const selectedUserInfos = () => selectUserInfos(userInfos, selectParams());

  return (
    <Frame component="main" class={styles.container}>
      <Frame class={styles.parameters}>
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

          <Label label="Role" vertical>
            <Select
              name="role"
              options={[ALL_OPTION, ...USER_ROLES.map((value) => ({ value }))]}
              value={userRole()}
              onChange={setUserRole}
            />
          </Label>

          <Label label="Search by Name or ID" vertical>
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

              <Toast message="Searching Users" show={isSearching()} loading />
            </fieldset>
          </Label>

          <Label label="Order By" vertical>
            <fieldset class={styles.fieldset}>
              <Select options={selectUserInfosSortOptions} value={sortKey()} onChange={setSortKey} />
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
      </Frame>

      <Frame class={styles.usersWrapper}>
        <p class={styles.label}>{selectUserInfosResultToString(selectedUserInfos().length, selectParams())}</p>
        <div class={styles.users}>
          <For each={selectedUserInfos()}>{(info) => <UserPreview userInfo={info} />}</For>
        </div>
      </Frame>
    </Frame>
  );
};

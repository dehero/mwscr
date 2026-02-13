import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createResource, createSignal, Show } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION } from '../../../core/entities/option.js';
import { safeParseSchema } from '../../../core/entities/schema.js';
import { UserRole } from '../../../core/entities/user.js';
import type { SelectUserInfosParams, SelectUserInfosSortKey } from '../../../core/entities/user-info.js';
import { selectUserInfosResultToString, selectUserInfosSortOptions } from '../../../core/entities/user-info.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { isObjectEqual } from '../../../core/utils/object-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
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
import { UserPreviews } from '../UserPreviews/UserPreviews.jsx';
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
    value: 'locators',
    label: 'Locators',
    searchParams: { sort: 'contribution,desc', role: 'locator' },
  },
  {
    value: 'requesters',
    label: 'Requesters',
    searchParams: { sort: 'contribution,desc', role: 'requester' },
  },
] as const satisfies UsersPagePreset[];

export const UsersPage = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams<UsersPageSearchParams>();

  const narrowScreen = createMediaQuery('(max-width: 811px)');

  let containerRef: HTMLDivElement | undefined;
  let usersRef: HTMLDivElement | undefined;
  const usersScrollTarget = () => (narrowScreen() ? containerRef : usersRef);

  const presetOptions = (): UsersPagePreset[] => {
    const options: UsersPagePreset[] = [...presets];
    const currentPreset = presets.find((preset) => isObjectEqual(preset.searchParams, searchParams()));

    if (!currentPreset) {
      options.push({ value: 'custom', label: 'Custom Selection', searchParams: searchParams() });
    }

    return options;
  };

  const userRole = () => safeParseSchema(UserRole, searchParams().role);
  const sortKey = () =>
    selectUserInfosSortOptions.find((sortOption) => sortOption.value === searchParams().sort?.split(',')[0])?.value ||
    'contribution';
  const sortDirection = () => (searchParams().sort?.split(',')[1] === 'asc' ? 'asc' : 'desc');
  const searchTerm = () => searchParams().search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams()))?.value;

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

  const [userInfos, { refetch }] = createResource(selectParams, (params) => dataManager.selectUserInfos(params));

  useLocalPatch(refetch);

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
      <Toast message="Loading Members" show={userInfos.loading} loading />

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

          <Label label="Search" labelClass={styles.labelWithFixedWidth}>
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

              <Toast message="Searching Members" show={isSearching()} loading />
            </fieldset>
          </Label>

          <Label label="Role" labelClass={styles.labelWithFixedWidth}>
            <Select
              name="role"
              options={[ALL_OPTION, ...UserRole.options.map((value) => ({ value }))]}
              value={userRole()}
              onChange={setUserRole}
            />
          </Label>

          <Label label="Order By" labelClass={styles.labelWithFixedWidth}>
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

      <Frame variant="thin" class={styles.users} ref={usersRef}>
        <Show when={userInfos()}>
          {(userInfos) => (
            <UserPreviews
              scrollTarget={usersScrollTarget()}
              userInfos={userInfos().items}
              label={selectUserInfosResultToString(userInfos().totalCount, userInfos().params)}
            />
          )}
        </Show>
      </Frame>
    </Frame>
  );
};

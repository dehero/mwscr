import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { SearchParams } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { createResource, createSignal, Show } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION, ASC_OPTION, DESC_OPTION } from '../../../core/entities/option.js';
import { safeParseSchema } from '../../../core/entities/schema.js';
import type { SiteRoutePage } from '../../../core/entities/site-route.js';
import { UserRole, userRoleDescriptors } from '../../../core/entities/user.js';
import type { SelectUserInfosParams, SelectUserInfosSortKey } from '../../../core/entities/user-info.js';
import { selectUserInfosResultToString, selectUserInfosSortOptions } from '../../../core/entities/user-info.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { isObjectEqual } from '../../../core/utils/object-utils.js';
import { AppPage } from '../../components/App/App.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { Checkbox } from '../../components/Checkbox/Checkbox.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { Label } from '../../components/Label/Label.jsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.jsx';
import { Select } from '../../components/Select/Select.jsx';
import { Spacer } from '../../components/Spacer/Spacer.jsx';
import { Toast } from '../../components/Toaster/Toaster.jsx';
import { UserPreviews } from '../../components/UserPreviews/UserPreviews.jsx';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localize } from '../../utils/intl-utils.js';
import type { UsersPageData, UsersPageParams } from './UsersPage.data.js';
import styles from './UsersPage.module.css';

export interface UsersPageSearchParams extends SearchParams {
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
  { value: undefined, label: texts.common.all, searchParams: {} },
  {
    value: 'authors',
    label: texts.user.authors,
    searchParams: { sort: 'contribution,desc', role: 'author' },
  },
  {
    value: 'locators',
    label: texts.user.locators,
    searchParams: { sort: 'contribution,desc', role: 'locator' },
  },
  {
    value: 'requesters',
    label: texts.user.requesters,
    searchParams: { sort: 'contribution,desc', role: 'requester' },
  },
] as const satisfies UsersPagePreset[];

export const UsersPage: SiteRoutePage<UsersPageParams, UsersPageData> = () => {
  const [searchParams, setSearchParams] = useSearchParams<UsersPageSearchParams>();

  const narrowScreen = createMediaQuery('(max-width: 811px)');

  let containerRef: HTMLDivElement | undefined;
  let usersRef: HTMLDivElement | undefined;
  const usersScrollTarget = () => (narrowScreen() ? containerRef : usersRef);

  const activeCount = () => Object.keys(searchParams).length;

  const presetOptions = (): UsersPagePreset[] => {
    const options: UsersPagePreset[] = [...presets];
    const currentPreset = presets.find((preset) => isObjectEqual(preset.searchParams, searchParams));

    if (!currentPreset) {
      options.push({
        value: 'custom',
        label: localize(texts.filtering.customOptions, { count: activeCount() }),
        searchParams,
      });
    }

    return options;
  };

  const userRole = () => safeParseSchema(UserRole, searchParams.role);
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

  const [userInfos, { refetch }] = createResource(selectParams, (params) => dataManager.selectUserInfos(params));

  useLocalPatch(refetch);

  return (
    <>
      <AppPage title={localize(texts.user.users)} description={localize(texts.app.usersDescription)} loading={false} />

      <Frame component="main" class={styles.container} ref={containerRef}>
        <Toast message={localize(texts.content.loadingUsers)} show={userInfos.loading} loading />

        <Frame class={styles.parameters}>
          <fieldset class={styles.presets}>
            <Select options={presetOptions()} value={preset()} onChange={setPreset} />
            <Button
              onClick={(e: Event) => {
                e.preventDefault();
                setPreset(undefined);
              }}
            >
              {localize(texts.filtering.resetOptions)}
            </Button>
            <Show when={narrowScreen()}>
              <Spacer />
              <Checkbox
                name="showParameters"
                value={expandParametersOnNarrowScreen()}
                onChange={setExpandParamatersOnNarrowScreen}
                trueLabel={localize(texts.filtering.collapse)}
                falseLabel={localize(texts.filtering.expand)}
              />
            </Show>
          </fieldset>

          <Show when={!narrowScreen() || expandParametersOnNarrowScreen()}>
            <Divider />

            <Label label={localize(texts.filtering.search)} labelClass={styles.labelWithFixedWidth}>
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
                  {localize(texts.filtering.clear)}
                </Button>

                <Toast message={localize(texts.filtering.searchingMembers)} show={isSearching()} loading />
              </fieldset>
            </Label>

            <Label label={localize(texts.user.role)} labelClass={styles.labelWithFixedWidth}>
              <Select
                name="role"
                options={[
                  ALL_OPTION,
                  ...UserRole.options.map((value) => ({ value, label: userRoleDescriptors[value].title })),
                ]}
                value={userRole()}
                onChange={setUserRole}
              />
            </Label>

            <Label label={localize(texts.filtering.orderBy)} labelClass={styles.labelWithFixedWidth}>
              <fieldset class={styles.fieldset}>
                <div class={styles.selectWrapper}>
                  <Select
                    options={selectUserInfosSortOptions}
                    value={sortKey()}
                    onChange={setSortKey}
                    class={styles.select}
                  />
                </div>
                <RadioGroup
                  name="sortDirection"
                  options={[ASC_OPTION, DESC_OPTION]}
                  value={sortDirection()}
                  onChange={setSortDirection}
                  class={styles.sortDirectionRadioGroup}
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
                label={selectUserInfosResultToString(userInfos().totalCount, userInfos().params, currentLocale())}
              />
            )}
          </Show>
        </Frame>
      </Frame>
    </>
  );
};

export default UsersPage;

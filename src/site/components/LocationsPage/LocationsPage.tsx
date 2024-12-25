import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createResource, createSignal, Show } from 'solid-js';
import { navigate } from 'vike/client/router';
import type { LocationType } from '../../../core/entities/location.js';
import { LOCATION_TYPES } from '../../../core/entities/location.js';
import type { SelectLocationInfosParams, SelectLocationInfosSortKey } from '../../../core/entities/location-info.js';
import { selectLocationInfosSortOptions } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION } from '../../../core/entities/option.js';
import type { SortDirection } from '../../../core/utils/common-types.js';
import { boolToString, isObjectEqual, stringToBool } from '../../../core/utils/common-utils.js';
import { dataExtractor } from '../../data-managers/extractor.js';
import { useSearchParams } from '../../hooks/useSearchParams.js';
import { Button } from '../Button/Button.jsx';
import { Checkbox } from '../Checkbox/Checkbox.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
// import { Icon } from '../Icon/Icon.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import { RadioGroup } from '../RadioGroup/RadioGroup.jsx';
import { Select } from '../Select/Select.jsx';
import { Spacer } from '../Spacer/Spacer.jsx';
import { Table } from '../Table/Table.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import { WorldMap } from '../WorldMap/WorldMap.jsx';
import styles from './LocationsPage.module.css';

export interface LocationsPageSearchParams {
  discovered?: string;
  type?: LocationType;
  search?: string;
  sort?: `${SelectLocationInfosSortKey},${SortDirection}`;
}

const emptySearchParams: LocationsPageSearchParams = {
  discovered: undefined,
  type: undefined,
  search: undefined,
  sort: undefined,
};

interface LocationsPagePreset extends Option {
  searchParams: LocationsPageSearchParams;
}

const presets = [{ value: undefined, label: 'All', searchParams: {} }] as const satisfies LocationsPagePreset[];

export const LocationsPage = (): JSX.Element => {
  let containerRef: HTMLDivElement | undefined;
  let locationsTableWrapperRef: HTMLDivElement | undefined;

  const [searchParams, setSearchParams] = useSearchParams<LocationsPageSearchParams>();

  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const locationsScrollTarget = () => (narrowScreen() ? containerRef : undefined);

  const presetOptions = (): LocationsPagePreset[] => {
    const options: LocationsPagePreset[] = [...presets];
    const currentPreset = presets.find((preset) => isObjectEqual(preset.searchParams, searchParams()));

    if (!currentPreset) {
      options.push({ value: 'custom', label: 'Custom Selection', searchParams: searchParams() });
    }

    return options;
  };

  const locationDiscovered = () => stringToBool(searchParams().discovered);
  const locationType = () => LOCATION_TYPES.find((type) => type === searchParams().type);
  const sortKey = () =>
    selectLocationInfosSortOptions.find((sortOption) => sortOption.value === searchParams().sort?.split(',')[0])
      ?.value || 'title';
  const sortDirection = () => (searchParams().sort?.split(',')[1] === 'desc' ? 'desc' : 'asc');
  const searchTerm = () => searchParams().search;
  const preset = () => presetOptions().find((preset) => isObjectEqual(preset.searchParams, searchParams()))?.value;

  const setLocationDiscovered = (discovered: boolean | undefined) => setSearchParams({ discovered });
  const setLocationType = (type: LocationType | undefined) => setSearchParams({ type });
  const setSearchTerm = (search: string | undefined) => setSearchParams({ search });
  const setSortKey = (key: SelectLocationInfosSortKey | undefined) =>
    setSearchParams({ sort: `${key || sortKey()},${sortDirection()}` });
  const setSortDirection = (direction: SortDirection | undefined) =>
    setSearchParams({ sort: `${sortKey()},${direction || sortDirection()}` });
  const setPreset = (preset: string | undefined) =>
    setSearchParams({ ...emptySearchParams, ...presetOptions().find((item) => item.value === preset)?.searchParams });

  const [isSearching, setIsSearching] = createSignal(false);
  const [expandParametersOnNarrowScreen, setExpandParamatersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'locations.expandParametersOnNarrowScreen',
  });

  const selectParams = (): SelectLocationInfosParams => ({
    discovered: locationDiscovered(),
    type: locationType(),
    search: searchTerm(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
  });

  const [selectedLocationInfos] = createResource(
    selectParams,
    async (selectParams) => (await dataExtractor.selectLocationInfos(selectParams)).items,
  );

  const handleSelect = (location: string | undefined) => {
    if (!location) {
      return;
    }
    // @ts-expect-error No proper typing for navigate
    navigate(locationRoute.createUrl({ title: location }));
  };

  return (
    <Frame component="main" class={styles.container} ref={containerRef}>
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

          <Label label="Coverage" component="div" vertical>
            <RadioGroup
              name="discovered"
              options={[ALL_OPTION, { value: 'true', label: 'Discovered' }, { value: 'false', label: 'Uncharted' }]}
              value={boolToString(locationDiscovered())}
              onChange={(value) => setLocationDiscovered(stringToBool(value))}
            />
          </Label>

          <Label label="Type" vertical>
            <Select
              name="type"
              options={[ALL_OPTION, ...LOCATION_TYPES.map((value) => ({ value }))]}
              value={locationType()}
              onChange={setLocationType}
            />
          </Label>

          <Label label="Search by Title" vertical>
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

              <Toast message="Searching Locations" show={isSearching()} loading />
            </fieldset>
          </Label>

          <Label label="Order By" vertical>
            <fieldset class={styles.fieldset}>
              <Select options={selectLocationInfosSortOptions} value={sortKey()} onChange={setSortKey} />
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

      <Frame variant="thin" class={styles.locationsTableWrapper} ref={locationsTableWrapperRef}>
        <Table
          class={styles.table}
          scrollTarget={locationsScrollTarget()}
          label="Locations"
          value="Post Count"
          rows={
            selectedLocationInfos()?.map((info) => ({
              label: info.title,
              // labelIcon: (
              //   <Icon color="fatigue" size="small" variant="flat">
              //     {info.type[0]?.toLocaleUpperCase()}
              //   </Icon>
              // ),
              value: info.discovered?.posts,
              onClick: (e: Event) => {
                e.preventDefault();
                handleSelect(info.title);
              },
              tooltip: (ref) => <LocationTooltip forRef={ref} location={info} />,
            })) ?? []
          }
          showEmptyValueRows
        />
      </Frame>

      <Frame variant="thin" class={styles.worldMap}>
        <WorldMap
          locations={selectedLocationInfos() ?? []}
          onSelectLocation={handleSelect}
          discoveredLocations={selectedLocationInfos()?.map(({ title }) => title) ?? []}
        />
      </Frame>
    </Frame>
  );
};

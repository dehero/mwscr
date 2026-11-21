import { createAsync } from '@solidjs/router';
import { createMemo, createSignal, Show } from 'solid-js';
import {
  getLocationCells,
  LOCATION_TYPES,
  type LocationType,
  locationCellToTravelCommand,
  locationToTravelCommand,
  locationTypeDescriptors,
} from '../../../core/entities/location.ts';
import {
  findWorldMapLocationInfo,
  selectLocationInfos,
  selectLocationInfosResultToString,
  type SelectLocationInfosSortKey,
  selectLocationInfosSortOptions,
} from '../../../core/entities/location-info.ts';
import { ALL_OPTION, ASC_OPTION, DESC_OPTION } from '../../../core/entities/option.ts';
import { isPostsUsageEmpty, type PostsUsage, postsUsageToString } from '../../../core/entities/posts-usage.ts';
import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.ts';
import type { SortDirection } from '../../../core/utils/common-types.ts';
import { AppPage } from '../../components/App/App.tsx';
import { Button } from '../../components/Button/Button.tsx';
import { Divider } from '../../components/Divider/Divider.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import { Input } from '../../components/Input/Input.tsx';
import { LocationTooltip } from '../../components/LocationTooltip/LocationTooltip.tsx';
import { Markdown } from '../../components/Markdown/Markdown.tsx';
import { OverflowContainer } from '../../components/OverflowContainer/OverflowContainer.tsx';
import { ProgressBar } from '../../components/ProgressBar/ProgressBar.tsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.tsx';
import { Select } from '../../components/Select/Select.tsx';
import { Table } from '../../components/Table/Table.tsx';
import { WorldMap } from '../../components/WorldMap/WorldMap.tsx';
import { postsRoute } from '../../routes/posts-route.ts';
import { texts } from '../../texts/index.ts';
import { currentLocale, localField, localize } from '../../utils/intl-utils.ts';
import type { LocationsPageData } from './LocationsPage.data.ts';
import { queryLocationsPageData } from './LocationsPage.data.ts';
import styles from './LocationsPage.module.css';

function sumUsage(usage: PostsUsage | undefined): number {
  return Object.values(usage ?? {}).reduce((acc, value) => acc + (value ?? 0), 0);
}

export const LocationsPage: SiteRoutePage<SiteRouteParams, LocationsPageData> = () => {
  const data = createAsync(() => queryLocationsPageData());

  const [filter, setFilter] = createSignal<string | undefined>(undefined);
  const [type, setType] = createSignal<LocationType | undefined>(undefined);
  const [search, setSearch] = createSignal<string | undefined>(undefined);
  const [sortKey, setSortKey] = createSignal<SelectLocationInfosSortKey>('title');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');
  const [selectedTitle, setSelectedTitle] = createSignal<string | undefined>();

  let listWrapperRef: HTMLDivElement | undefined;

  const locationInfos = () => data()?.locationInfos ?? [];

  const filteredInfos = createMemo(() =>
    selectLocationInfos(locationInfos(), {
      discovered: filter() === 'true' ? true : filter() === 'false' ? false : undefined,
      type: type(),
      search: search(),
      sortKey: sortKey(),
      sortDirection: sortDirection(),
      locale: currentLocale(),
    }),
  );

  const visitedInfos = createMemo(() => locationInfos().filter((info) => !isPostsUsageEmpty(info.discovered)));
  const visitedCount = () => visitedInfos().length;

  const selectedInfo = createMemo(() => locationInfos().find((info) => info.title === selectedTitle()));
  const selectedCells = createMemo(() => getLocationCells(selectedInfo()?.cell));
  const selectedWorldMapInfo = createMemo(() => {
    const title = selectedTitle();
    return title ? findWorldMapLocationInfo(locationInfos(), title) : undefined;
  });

  const filterOptions = () => [
    { value: undefined, label: localize(texts.common.all) },
    { value: 'true', label: localize(texts.locations.visited) },
    { value: 'false', label: localize(texts.locations.unvisited) },
  ];

  const typeOptions = () => [
    ALL_OPTION,
    ...LOCATION_TYPES.map((value) => ({ value, label: locationTypeDescriptors[value].title })),
  ];

  const sortOptions = () =>
    selectLocationInfosSortOptions.map((option) => ({ value: option.value, label: option.label }));

  const resultText = () =>
    selectLocationInfosResultToString(filteredInfos().length, {
      discovered: filter() === 'true' ? true : filter() === 'false' ? false : undefined,
      type: type(),
      search: search(),
      sortKey: sortKey(),
      sortDirection: sortDirection(),
      locale: currentLocale(),
    });

  const handleRandom = () => {
    const infos = filteredInfos();

    if (infos.length === 0) {
      return;
    }

    const index = Math.floor(Math.random() * infos.length);
    setSelectedTitle(infos[index]?.title);
  };

  return (
    <>
      <AppPage
        title={localize(texts.location.locations)}
        description={localize(texts.app.locationsDescription)}
        loading={!data()}
      />

      <Show when={data()}>
        <Frame component="main" class={styles.container}>
          <Frame class={styles.coveragePanel}>
            <RadioGroup
              name="filter"
              options={filterOptions()}
              value={filter()}
              onChange={setFilter}
              class={styles.coverageFilter}
            />
            <div class={styles.summary}>
              <span>
                {localize(texts.locations.visitedSummary, { count: visitedCount(), total: locationInfos().length })}
              </span>
            </div>
            <ProgressBar class={styles.progress} value={visitedCount()} maximum={locationInfos().length || 1} />
          </Frame>

          <Frame class={styles.listPanel}>
            <div class={styles.listToolbar}>
              <OverflowContainer
                containerClass={styles.typeOverflow}
                fallback={<Select name="type" options={typeOptions()} value={type()} onChange={setType} />}
              >
                <RadioGroup
                  name="type"
                  options={typeOptions()}
                  value={type()}
                  onChange={setType}
                  class={styles.typeNavigationGroup}
                />
              </OverflowContainer>
              <div class={styles.sort}>
                <Select name="sort" options={sortOptions()} value={sortKey()} onChange={setSortKey} />
                <RadioGroup
                  name="sortDirection"
                  options={[ASC_OPTION, DESC_OPTION]}
                  value={sortDirection()}
                  onChange={setSortDirection}
                />
              </div>
              <div class={styles.searchWrapper}>
                <div class={styles.searchInputWrapper}>
                  <Input
                    name="search"
                    type="search"
                    value={search()}
                    onDebouncedChange={(value) => setSearch(value || undefined)}
                  />
                </div>
                <Show when={search()}>
                  <Button type="button" onClick={() => setSearch(undefined)}>
                    {localize(texts.filtering.clear)}
                  </Button>
                </Show>
              </div>
            </div>
            <Divider class={styles.listDivider} />
            <div class={styles.resultRow}>
              <p class={styles.resultText}>{resultText()}</p>
              <Button onClick={handleRandom} disabled={filteredInfos().length === 0}>
                {localize(texts.locations.random)}
              </Button>
            </div>
            <Divider class={styles.listDivider} />
            <div class={styles.listWrapper} ref={listWrapperRef}>
              <Table
                scrollTarget={listWrapperRef}
                class={styles.list}
                label={localize(texts.location.locations)}
                value={localize(texts.metrics.postCount)}
                rows={filteredInfos().map((info) => ({
                  label: localField(info, 'title') || info.title,
                  value: sumUsage(info.discovered) || undefined,
                  selected: info.title === selectedTitle(),
                  onClick: (e: Event) => {
                    e.preventDefault();
                    setSelectedTitle(info.title);
                  },
                  tooltip: (ref: HTMLElement) => <LocationTooltip forRef={ref} location={info} />,
                }))}
                showEmptyValueRows
              />
            </div>
          </Frame>

          <Frame class={styles.mapPanel}>
            <WorldMap
              class={styles.worldMap}
              locations={filteredInfos()}
              currentLocation={selectedTitle()}
              currentLocationInfo={selectedWorldMapInfo()}
              discoveredLocations={filteredInfos().map((info) => info.title)}
              onSelectLocation={setSelectedTitle}
            />
          </Frame>

          <Frame class={styles.cardPanel}>
            <Show
              when={selectedInfo()}
              fallback={<p class={styles.placeholder}>{localize(texts.locations.selectLocation)}</p>}
            >
              {(info) => {
                const title = () => localField(info(), 'title') || info().title;
                const secondTitle = () => localField(info(), 'title', true);
                return (
                  <>
                    <section class={styles.titles}>
                      <p class={styles.title}>{title()}</p>
                      <Show when={secondTitle() && secondTitle() !== title()}>
                        <p class={styles.titleRu}>{secondTitle()}</p>
                      </Show>
                    </section>
                    <Table
                      rows={[
                        {
                          label: localize(texts.field.type),
                          value: localize(locationTypeDescriptors[info().type].title),
                        },
                        { label: localize(texts.field.addon), value: info().addon },
                        {
                          label: localize(texts.location.usage),
                          value: postsUsageToString(info().discovered, currentLocale()),
                        },
                      ]}
                    />
                    <Divider />
                    <div class={styles.blockTitle}>{localize(texts.locations.quickTravel)}</div>
                    <Markdown>{`\`\`\`\n${locationToTravelCommand(info())}\n\`\`\``}</Markdown>
                    <Show when={selectedCells().length > 0}>
                      <div class={styles.blockTitle}>{localize(texts.field.cell)}</div>
                      <Markdown>
                        {selectedCells()
                          .map((cell) => `\`\`\`\n${locationCellToTravelCommand(cell)}\n\`\`\`  `)
                          .join('\n')}
                      </Markdown>
                    </Show>
                    <Divider />
                    <div class={styles.actions}>
                      <Button href={postsRoute.createUrl({ managerName: 'posts', location: info().title })}>
                        {localize(texts.locations.postsInLocation)}
                      </Button>
                    </div>
                  </>
                );
              }}
            </Show>
          </Frame>
        </Frame>
      </Show>
    </>
  );
};

export default LocationsPage;

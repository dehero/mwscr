import { createMediaQuery } from '@solid-primitives/media';
import clsx from 'clsx';
import { type Component, createMemo, createSignal, Match, Show, Switch } from 'solid-js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../../core/entities/option.js';
import type { PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import { boolToString, stringToBool } from '../../../core/utils/common-utils.js';
import type { PostsRouteParams } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { Select } from '../Select/Select.js';
import { Table } from '../Table/Table.jsx';
import { Toast } from '../Toaster/Toaster.js';
import { WorldMap } from '../WorldMap/WorldMap.jsx';
import type { usePostsPageParameters } from './hooks/usePostsPageParameters.js';
import styles from './Parameters.module.css';
import type { PostsPageData } from './PostsPage.data.js';
import type { PostsPageInfo } from './PostsPage.jsx';

interface LocationOption extends Option {
  postCount?: number;
  info?: LocationInfo;
}

const viewOptions = [
  { label: 'All', value: undefined },
  { label: 'Locations', value: 'locations' },
  { label: 'Map', value: 'map' },
] as const satisfies Option[];

type View = (typeof viewOptions)[number]['value'];

export interface ParametersProps {
  routeInfo: SiteRouteInfo<PostsRouteParams, PostsPageData, PostsPageInfo>;
  parameters: ReturnType<typeof usePostsPageParameters>;
  class?: string;
  expandedOnNarrowScreen: boolean;
  onExpandedOnNarrowScreenChange: (value: boolean | undefined) => void;
}

export const Parameters: Component<ParametersProps> = (props) => {
  let locationsWrapperRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');

  const [isSearching, setIsSearching] = createSignal(false);

  const locationOptions = createMemo((): LocationOption[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.routeInfo
      .data()
      .locationInfos.map((info) => ({
        label: info.title,
        value: info.title,
        postCount: info.discovered?.[props.routeInfo.params().managerName],
        info,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]);
  const authorOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ...props.routeInfo.data().authorInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.authored?.[props.routeInfo.params().managerName]})`,
        value: info.id,
      }),
    ),
  ]);
  const requesterOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.routeInfo.data().requesterInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.requested?.[props.routeInfo.params().managerName]})`,
        value: info.id,
      }),
    ),
  ]);

  const locationOption = createMemo(() =>
    locationOptions().find((option) => option.value === props.parameters.location()),
  );

  const initialView = createMemo(() => {
    const info = props.routeInfo
      .data()
      .locationInfos.find((location) => location.title === props.parameters.location());
    if (info) {
      if (info.cell) {
        return 'map';
      }
      return 'locations';
    }

    return undefined;
  });

  const [view, setView] = createSignal<View>(initialView());
  const expanded = () => !narrowScreen() || props.expandedOnNarrowScreen;

  return (
    <Frame
      class={clsx(
        styles.container,
        view() && styles[`container_view_${view()!}`],
        expanded() && styles.container_expanded,
        props.class,
      )}
    >
      <div class={styles.toolbarWrapper}>
        <div class={styles.toolbar}>
          <Show
            when={expanded()}
            fallback={
              <fieldset class={styles.fieldset}>
                <Select
                  options={props.parameters.presetOptions()}
                  value={props.parameters.preset()}
                  onChange={props.parameters.setPreset}
                />
                <Button
                  onClick={(e: Event) => {
                    e.preventDefault();
                    props.parameters.setPreset(undefined);
                  }}
                >
                  Reset
                </Button>
              </fieldset>
            }
          >
            <RadioGroup name="view" options={viewOptions} value={view()} onChange={setView} class={styles.view} />
          </Show>

          <Show when={narrowScreen()}>
            <Checkbox
              name="expandParameters"
              value={props.expandedOnNarrowScreen}
              onChange={props.onExpandedOnNarrowScreenChange}
              trueLabel="Collapse"
              falseLabel="Expand"
            />
          </Show>
        </div>

        <Show when={expanded()}>
          <Divider class={styles.toolbarDivider} />
        </Show>
      </div>

      <Show when={expanded()}>
        <Switch>
          <Match when={typeof view() === 'undefined'}>
            <form class={styles.parameters}>
              <Label label="Preset" vertical>
                <fieldset class={styles.fieldset}>
                  <div class={styles.selectWrapper}>
                    <Select
                      options={props.parameters.presetOptions()}
                      value={props.parameters.preset()}
                      onChange={props.parameters.setPreset}
                      class={styles.select}
                    />
                  </div>

                  <Button
                    onClick={(e: Event) => {
                      e.preventDefault();
                      props.parameters.setPreset(undefined);
                    }}
                  >
                    Reset
                  </Button>
                </fieldset>
              </Label>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('original')}>
                <Label label="Originality" component="div" vertical>
                  <RadioGroup
                    name="original"
                    options={[ALL_OPTION, { value: 'true', label: 'Originals' }, { value: 'false', label: 'Reposts' }]}
                    value={boolToString(props.parameters.original())}
                    onChange={(value) => props.parameters.setOriginal(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('publishable')}>
                <Label label="Publishability" component="div" vertical>
                  <RadioGroup
                    name="publishable"
                    options={[ALL_OPTION, { value: 'true', label: 'Ready' }, { value: 'false', label: 'In Work' }]}
                    value={boolToString(props.parameters.publishable())}
                    onChange={(value) => props.parameters.setPublishable(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('date')}>
                <Label label="Date" vertical>
                  <DatePicker
                    value={props.parameters.date()}
                    onChange={props.parameters.setDate}
                    period
                    emptyLabel="All"
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('type')}>
                <Label label="Type" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="type"
                      options={[
                        ALL_OPTION,
                        ...POST_TYPES.map((info) => ({ value: info.id, label: info.title })).sort((a, b) =>
                          a.label.localeCompare(b.label),
                        ),
                      ]}
                      value={props.parameters.type()}
                      onChange={props.parameters.setType}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Label label="Search by Title or Description" vertical>
                <fieldset class={styles.fieldset}>
                  <div class={styles.searchInputWrapper}>
                    <Input
                      name="search"
                      value={props.parameters.search()}
                      onChange={() => setIsSearching(true)}
                      onDebouncedChange={(value) => {
                        props.parameters.setSearch(value);
                        setIsSearching(false);
                      }}
                    />
                  </div>

                  <Button
                    onClick={(e: Event) => {
                      e.preventDefault();
                      props.parameters.setSearch('');
                      setIsSearching(false);
                    }}
                  >
                    Clear
                  </Button>

                  <Toast message="Searching Posts" show={isSearching()} loading />
                </fieldset>
              </Label>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('location')}>
                <Label label="Location" vertical class={styles.label}>
                  <Button onClick={() => setView('locations')}>
                    {locationOption()?.label}
                    <Show when={locationOption()?.postCount}>{(postCount) => <> ({postCount})</>}</Show>
                  </Button>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('tag')}>
                <Label label="Tag" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="tag"
                      options={[ALL_OPTION, ...props.routeInfo.data().tagOptions]}
                      value={props.parameters.tag()}
                      onChange={props.parameters.setTag}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('author')}>
                <Label label="Author" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="author"
                      options={authorOptions()}
                      value={props.parameters.author()}
                      onChange={props.parameters.setAuthor}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('requester')}>
                <Label label="Requester" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="requester"
                      options={requesterOptions()}
                      value={props.parameters.requester()}
                      onChange={props.parameters.setRequester}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('mark')}>
                <Label label="Editor's Mark" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="mark"
                      options={[ALL_OPTION, ...POST_MARKS.map(({ id }) => ({ value: id }))]}
                      value={props.parameters.mark()}
                      onChange={props.parameters.setMark}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('violation')}>
                <Label label="Violation" vertical>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="violation"
                      options={[
                        ALL_OPTION,
                        ANY_OPTION,
                        NONE_OPTION,
                        ...Object.entries(POST_VIOLATIONS).map(([value, violation]) => ({
                          value: value as PostViolation,
                          label: violation.title,
                        })),
                      ]}
                      value={props.parameters.violation()}
                      onChange={props.parameters.setViolation}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={props.parameters.sortOptions().length > 0}>
                <Label label="Sort By" vertical>
                  <fieldset class={styles.fieldset}>
                    <div class={styles.selectWrapper}>
                      <Select
                        options={props.parameters.sortOptions()}
                        value={props.parameters.sortKey()}
                        onChange={props.parameters.setSortKey}
                        class={styles.select}
                      />
                    </div>
                    <RadioGroup
                      name="sortDirection"
                      options={[
                        { value: 'asc', label: 'Asc' },
                        { value: 'desc', label: 'Desc' },
                      ]}
                      value={props.parameters.sortDirection()}
                      onChange={props.parameters.setSortDirection}
                      class={styles.sortDirectionRadioGroup}
                    />
                  </fieldset>
                </Label>
              </Show>
            </form>
          </Match>
          <Match when={view() === 'locations'}>
            <div class={styles.locationsWrapper} ref={locationsWrapperRef}>
              <Table
                class={styles.locations}
                scrollTarget={locationsWrapperRef}
                label="Locations"
                value="Post Count"
                rows={locationOptions().map((option) => ({
                  label: option.label,
                  value: option.postCount,
                  onClick: (e: Event) => {
                    e.preventDefault();
                    props.parameters.setLocation(option.value);
                  },
                  selected: option.value === props.parameters.location(),
                  tooltip: option.info ? (ref) => <LocationTooltip forRef={ref} location={option.info!} /> : undefined,
                }))}
                showEmptyValueRows
              />
            </div>
          </Match>
          <Match when={view() === 'map'}>
            <WorldMap
              locations={props.routeInfo.data().locationInfos}
              class={styles.worldMap}
              onSelectLocation={props.parameters.setLocation}
              currentLocation={props.parameters.location()}
              discoveredLocations={props.routeInfo.data().locationInfos.map(({ title }) => title)}
            />
          </Match>
        </Switch>
      </Show>
    </Frame>
  );
};

import { createMediaQuery } from '@solid-primitives/media';
import clsx from 'clsx';
import { type Component, createMemo, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { ListReaderItemStatus } from '../../../core/entities/list-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../../core/entities/option.js';
import {
  PostAddon,
  PostMark,
  PostPlacement,
  PostViolation,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import type { SiteRouteInfo } from '../../../core/entities/site-route.js';
import { boolToString, capitalizeFirstLetter, stringToBool } from '../../../core/utils/common-utils.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { DatePicker } from '../DatePicker/DatePicker.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { LocationTooltip } from '../LocationTooltip/LocationTooltip.jsx';
import { OverflowContainer } from '../OverflowContainer/OverflowContainer.jsx';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { Select } from '../Select/Select.js';
import { Table } from '../Table/Table.jsx';
import { Toast } from '../Toaster/Toaster.js';
import { WorldMap } from '../WorldMap/WorldMap.jsx';
import type { FilterKey, usePostsPageParameters } from './hooks/usePostsPageParameters.js';
import styles from './Parameters.module.css';
import type { PostsPageData, PostsPageParams } from './PostsPage.data.js';
import type { PostsPageInfo } from './PostsPage.jsx';

interface LocationOption extends Option {
  postCount?: number;
  info?: LocationInfo;
}

interface TagOption extends Option {
  postCount?: number;
}

interface ViewOption extends Option {
  filter?: FilterKey;
}

const allViewOptions: ViewOption[] = [
  { label: 'All Options', value: undefined },
  { label: 'Locations', value: 'locations', filter: 'location' },
  { label: 'Tags', value: 'tags', filter: 'tag' },
  { label: 'Map', value: 'map', filter: 'location' },
] as const;

type View = (typeof allViewOptions)[number]['value'];

export interface ParametersProps {
  routeInfo: SiteRouteInfo<PostsPageParams, PostsPageData, PostsPageInfo>;
  parameters: ReturnType<typeof usePostsPageParameters>;
  class?: string;
  expandedOnNarrowScreen: boolean;
  onExpandedOnNarrowScreenChange: (value: boolean | undefined) => void;
}

export const Parameters: Component<ParametersProps> = (props) => {
  let locationsWrapperRef: HTMLDivElement | undefined;
  let tagsWrapperRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');

  const [isSearching, setIsSearching] = createSignal(false);

  const viewOptions = () =>
    allViewOptions.filter(
      (option) =>
        !option.filter || !props.routeInfo.meta().filters || props.routeInfo.meta().filters?.includes(option.filter),
    );

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
  const tagOptions = createMemo((): TagOption[] => [
    ALL_OPTION,
    ...props.routeInfo
      .data()
      .tagInfos.map((info) => ({
        label: info.id,
        value: info.id,
        postCount: info.tagged?.[props.routeInfo.params().managerName],
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
  const locatorOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.routeInfo.data().locatorInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.located?.[props.routeInfo.params().managerName]})`,
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

  const tagOption = createMemo(() => tagOptions().find((option) => option.value === props.parameters.tag()));

  const detectInitialView = () => {
    const locationInfo = props.routeInfo
      .data()
      .locationInfos.find((location) => location.title === props.parameters.location());

    if (locationInfo) {
      if (locationInfo.cell) {
        return 'map';
      }
      return 'locations';
    }

    const tagInfo = props.routeInfo.data().tagInfos.find((tag) => tag.id === props.parameters.tag());
    if (tagInfo) {
      return 'tags';
    }

    return undefined;
  };

  onMount(() => {
    setView(detectInitialView());
  });

  const [view, setView] = createSignal<View>();
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
              <div class={styles.selectWrapper}>
                <Select
                  options={props.parameters.presetOptions()}
                  value={props.parameters.preset()}
                  onChange={props.parameters.setPreset}
                  class={styles.select}
                />
              </div>
            }
          >
            <OverflowContainer
              fallback={<Select options={viewOptions()} value={view()} onChange={setView} />}
              containerClass={styles.viewWrapper}
            >
              <RadioGroup name="view" options={viewOptions()} value={view()} onChange={setView} class={styles.view} />
            </OverflowContainer>
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
          <Match when={typeof view() === 'undefined'} keyed>
            <form class={styles.parameters}>
              <Label label="Preset" labelClass={styles.labelWithFixedWidth}>
                <div class={styles.selectWrapper}>
                  <Select
                    options={props.parameters.presetOptions()}
                    value={props.parameters.preset()}
                    onChange={props.parameters.setPreset}
                    class={styles.select}
                  />
                </div>
              </Label>

              <Label label="Search" labelClass={styles.labelWithFixedWidth}>
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

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('original')}>
                <Label label="Recency" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="original"
                    options={[ALL_OPTION, { value: 'true', label: 'Originals' }, { value: 'false', label: 'Reposts' }]}
                    value={boolToString(props.parameters.original())}
                    onChange={(value) => props.parameters.setOriginal(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('official')}>
                <Label label="Origin" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="official"
                    options={[
                      ALL_OPTION,
                      { value: 'true', label: 'Official' },
                      { value: 'false', label: 'Third-Party' },
                    ]}
                    value={boolToString(props.parameters.official())}
                    onChange={(value) => props.parameters.setOfficial(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('publishable')}>
                <Label label="Publishability" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="publishable"
                    options={[ALL_OPTION, { value: 'true', label: 'Ready' }, { value: 'false', label: 'In Work' }]}
                    value={boolToString(props.parameters.publishable())}
                    onChange={(value) => props.parameters.setPublishable(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('date')}>
                <Label label="Date" labelClass={styles.labelWithFixedWidth}>
                  <DatePicker
                    value={props.parameters.date()}
                    onChange={props.parameters.setDate}
                    period
                    emptyLabel="All"
                  />
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('type')}>
                <Label label="Type" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <RadioGroup
                      name="type"
                      options={props.parameters.typeOptions()}
                      value={props.parameters.type()}
                      onChange={props.parameters.setType}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('placement')}>
                <Label label="Placement" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="placement"
                      options={[
                        ALL_OPTION,
                        ANY_OPTION,
                        NONE_OPTION,
                        ...PostPlacement.options.map((value) => ({ value })),
                      ]}
                      value={props.parameters.placement()}
                      onChange={props.parameters.setPlacement}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('location')}>
                <Label label="Location" class={styles.label} labelClass={styles.labelWithFixedWidth}>
                  <Button onClick={() => setView('locations')}>
                    {locationOption()?.label}
                    <Show when={locationOption()?.postCount}>{(postCount) => <> ({postCount})</>}</Show>
                  </Button>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('addon')}>
                <Label label="Addon" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="addon"
                      options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...PostAddon.options.map((value) => ({ value }))]}
                      value={props.parameters.addon()}
                      onChange={props.parameters.setAddon}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('tag')}>
                <Label label="Tag" class={styles.label} labelClass={styles.labelWithFixedWidth}>
                  <Button onClick={() => setView('tags')}>
                    {tagOption()?.label}
                    <Show when={tagOption()?.postCount}>{(postCount) => <> ({postCount})</>}</Show>
                  </Button>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('author')}>
                <Label label="Author" labelClass={styles.labelWithFixedWidth}>
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

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('locator')}>
                <Label label="Located By" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="locator"
                      options={locatorOptions()}
                      value={props.parameters.locator()}
                      onChange={props.parameters.setLocator}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('requester')}>
                <Label label="Requested By" labelClass={styles.labelWithFixedWidth}>
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
                <Label label="Editor's Mark" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="mark"
                      options={[ALL_OPTION, ...PostMark.options.map((value) => ({ value }))]}
                      value={props.parameters.mark()}
                      onChange={props.parameters.setMark}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('violation')}>
                <Label label="Violation" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="violation"
                      options={[
                        ALL_OPTION,
                        ANY_OPTION,
                        NONE_OPTION,
                        ...PostViolation.options.map((value) => ({
                          value,
                          label: postViolationDescriptors[value].title,
                        })),
                      ]}
                      value={props.parameters.violation()}
                      onChange={props.parameters.setViolation}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!props.routeInfo.meta().filters || props.routeInfo.meta().filters!.includes('status')}>
                <Label label="Unsaved Status" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="status"
                      options={[
                        ALL_OPTION,
                        ANY_OPTION,
                        NONE_OPTION,
                        ...ListReaderItemStatus.options.map((value) => ({
                          label: capitalizeFirstLetter(value),
                          value,
                        })),
                      ]}
                      value={props.parameters.status()}
                      onChange={props.parameters.setStatus}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={props.parameters.sortOptions().length > 0}>
                <Label label="Order By" labelClass={styles.labelWithFixedWidth}>
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
          <Match when={view() === 'locations'} keyed>
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
          <Match when={view() === 'tags'} keyed>
            <div class={styles.tagsWrapper} ref={tagsWrapperRef}>
              <Table
                class={styles.tags}
                scrollTarget={tagsWrapperRef}
                label="Tags"
                value="Post Count"
                rows={tagOptions().map((option) => ({
                  label: option.label,
                  value: option.postCount,
                  onClick: (e: Event) => {
                    e.preventDefault();
                    props.parameters.setTag(option.value);
                  },
                  selected: option.value === props.parameters.tag(),
                }))}
                showEmptyValueRows
              />
            </div>
          </Match>
          <Match when={view() === 'map'} keyed>
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

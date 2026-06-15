import { createMediaQuery } from '@solid-primitives/media';
import clsx from 'clsx';
import { type Component, createMemo, createSignal, Match, onMount, Show, Switch } from 'solid-js';
import { ListReaderItemStatus } from '../../../core/entities/list-manager.js';
import type { LocationInfo } from '../../../core/entities/location-info.js';
import { aspectRatioToReadableText } from '../../../core/entities/media.js';
import type { Option } from '../../../core/entities/option.js';
import { ALL_OPTION, ANY_OPTION, NONE_OPTION } from '../../../core/entities/option.js';
import {
  PostAddon,
  PostAspectRatio,
  PostMark,
  PostPlacement,
  PostViolation,
  postViolationDescriptors,
} from '../../../core/entities/post.js';
import { boolToString, capitalizeFirstLetter, stringToBool } from '../../../core/utils/common-utils.js';
import { Button } from '../../components/Button/Button.jsx';
import { Checkbox } from '../../components/Checkbox/Checkbox.jsx';
import { DatePicker } from '../../components/DatePicker/DatePicker.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { Label } from '../../components/Label/Label.jsx';
import { LocationTooltip } from '../../components/LocationTooltip/LocationTooltip.jsx';
import { OverflowContainer } from '../../components/OverflowContainer/OverflowContainer.jsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.jsx';
import { Select } from '../../components/Select/Select.jsx';
import { Table } from '../../components/Table/Table.jsx';
import { Toast } from '../../components/Toaster/Toaster.jsx';
import { WorldMap } from '../../components/WorldMap/WorldMap.jsx';
import { type FilterKey, postsPageLayouts, type usePostsPageOptions } from './hooks/usePostsPageOptions.js';
import styles from './Options.module.css';
import type { PostsPageData, PostsPageParams } from './PostsPage.data.js';

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

export interface OptionsProps {
  params: PostsPageParams;
  data: PostsPageData;
  options: ReturnType<typeof usePostsPageOptions>;
  class?: string;
  expandedOnNarrowScreen: boolean;
  onExpandedOnNarrowScreenChange: (value: boolean | undefined) => void;
}

export const Options: Component<OptionsProps> = (props) => {
  const layout = () => postsPageLayouts[props.params.managerName];

  let locationsWrapperRef: HTMLDivElement | undefined;
  let tagsWrapperRef: HTMLDivElement | undefined;
  const narrowScreen = createMediaQuery('(max-width: 811px)');

  const [isSearching, setIsSearching] = createSignal(false);

  const viewOptions = () =>
    allViewOptions.filter((option) => !option.filter || !layout().filters || layout().filters?.includes(option.filter));

  const locationOptions = createMemo((): LocationOption[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.data.locationInfos
      .map((info) => ({
        label: info.title,
        value: info.title,
        postCount: info.discovered?.[props.params.managerName],
        info,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]);
  const tagOptions = createMemo((): TagOption[] => [
    ALL_OPTION,
    ...props.data.tagInfos
      .map((info) => ({
        label: info.id,
        value: info.id,
        postCount: info.tagged?.[props.params.managerName],
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]);
  const authorOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ...props.data.authorInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.authored?.[props.params.managerName]})`,
        value: info.id,
      }),
    ),
  ]);
  const locatorOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.data.locatorInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.located?.[props.params.managerName]})`,
        value: info.id,
      }),
    ),
  ]);
  const requesterOptions = createMemo((): Option[] => [
    ALL_OPTION,
    ANY_OPTION,
    NONE_OPTION,
    ...props.data.requesterInfos.map(
      (info): Option => ({
        label: `${info.title} (${info.requested?.[props.params.managerName]})`,
        value: info.id,
      }),
    ),
  ]);

  const locationOption = createMemo(() =>
    locationOptions().find((option) => option.value === props.options.location()),
  );

  const tagOption = createMemo(() => tagOptions().find((option) => option.value === props.options.tag()));

  const detectInitialView = () => {
    const locationInfo = props.data.locationInfos.find((location) => location.title === props.options.location());

    if (locationInfo) {
      if (locationInfo.cell) {
        return 'map';
      }
      return 'locations';
    }

    const tagInfo = props.data.tagInfos.find((tag) => tag.id === props.options.tag());
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
                  options={props.options.presetOptions()}
                  value={props.options.preset()}
                  onChange={props.options.setPreset}
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
                    options={props.options.presetOptions()}
                    value={props.options.preset()}
                    onChange={props.options.setPreset}
                    class={styles.select}
                  />
                </div>
              </Label>

              <Label label="Search" labelClass={styles.labelWithFixedWidth}>
                <fieldset class={styles.fieldset}>
                  <div class={styles.searchInputWrapper}>
                    <Input
                      name="search"
                      value={props.options.search()}
                      onChange={() => setIsSearching(true)}
                      onDebouncedChange={(value) => {
                        props.options.setSearch(value);
                        setIsSearching(false);
                      }}
                    />
                  </div>

                  <Button
                    onClick={(e: Event) => {
                      e.preventDefault();
                      props.options.setSearch('');
                      setIsSearching(false);
                    }}
                  >
                    Clear
                  </Button>

                  <Toast message="Searching Posts" show={isSearching()} loading />
                </fieldset>
              </Label>

              <Show when={!layout().filters || layout().filters!.includes('original')}>
                <Label label="Recency" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="original"
                    options={[ALL_OPTION, { value: 'true', label: 'Originals' }, { value: 'false', label: 'Reposts' }]}
                    value={boolToString(props.options.original())}
                    onChange={(value) => props.options.setOriginal(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('official')}>
                <Label label="Origin" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="official"
                    options={[
                      ALL_OPTION,
                      { value: 'true', label: 'Official' },
                      { value: 'false', label: 'Third-Party' },
                    ]}
                    value={boolToString(props.options.official())}
                    onChange={(value) => props.options.setOfficial(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('publishable')}>
                <Label label="Publishability" component="div" labelClass={styles.labelWithFixedWidth}>
                  <RadioGroup
                    name="publishable"
                    options={[ALL_OPTION, { value: 'true', label: 'Ready' }, { value: 'false', label: 'In Work' }]}
                    value={boolToString(props.options.publishable())}
                    onChange={(value) => props.options.setPublishable(stringToBool(value))}
                  />
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('date')}>
                <Label label="Date" labelClass={styles.labelWithFixedWidth}>
                  <DatePicker value={props.options.date()} onChange={props.options.setDate} period emptyLabel="All" />
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('type')}>
                <Label label="Type" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <RadioGroup
                      name="type"
                      options={props.options.typeOptions()}
                      value={props.options.type()}
                      onChange={props.options.setType}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('aspect')}>
                <Label label="Aspect Ratio" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <RadioGroup
                      name="aspect"
                      options={[
                        ALL_OPTION,
                        ...PostAspectRatio.options.map((value) => ({ label: aspectRatioToReadableText(value), value })),
                      ]}
                      value={props.options.aspect()}
                      onChange={props.options.setAspect}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('placement')}>
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
                      value={props.options.placement()}
                      onChange={props.options.setPlacement}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('location')}>
                <Label label="Location" class={styles.label} labelClass={styles.labelWithFixedWidth}>
                  <Button onClick={() => setView('locations')}>
                    {locationOption()?.label}
                    <Show when={locationOption()?.postCount}>{(postCount) => <> ({postCount})</>}</Show>
                  </Button>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('addon')}>
                <Label label="Addon" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="addon"
                      options={[ALL_OPTION, ANY_OPTION, NONE_OPTION, ...PostAddon.options.map((value) => ({ value }))]}
                      value={props.options.addon()}
                      onChange={props.options.setAddon}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('tag')}>
                <Label label="Tag" class={styles.label} labelClass={styles.labelWithFixedWidth}>
                  <Button onClick={() => setView('tags')}>
                    {tagOption()?.label}
                    <Show when={tagOption()?.postCount}>{(postCount) => <> ({postCount})</>}</Show>
                  </Button>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('author')}>
                <Label label="Author" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="author"
                      options={authorOptions()}
                      value={props.options.author()}
                      onChange={props.options.setAuthor}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('locator')}>
                <Label label="Located By" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="locator"
                      options={locatorOptions()}
                      value={props.options.locator()}
                      onChange={props.options.setLocator}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('requester')}>
                <Label label="Requested By" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="requester"
                      options={requesterOptions()}
                      value={props.options.requester()}
                      onChange={props.options.setRequester}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('mark')}>
                <Label label="Editor's Mark" labelClass={styles.labelWithFixedWidth}>
                  <div class={styles.selectWrapper}>
                    <Select
                      name="mark"
                      options={[ALL_OPTION, ...PostMark.options.map((value) => ({ value }))]}
                      value={props.options.mark()}
                      onChange={props.options.setMark}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('violation')}>
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
                      value={props.options.violation()}
                      onChange={props.options.setViolation}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={!layout().filters || layout().filters!.includes('status')}>
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
                      value={props.options.status()}
                      onChange={props.options.setStatus}
                      class={styles.select}
                    />
                  </div>
                </Label>
              </Show>

              <Show when={props.options.sortOptions().length > 0}>
                <Label label="Order By" labelClass={styles.labelWithFixedWidth}>
                  <fieldset class={styles.fieldset}>
                    <div class={styles.selectWrapper}>
                      <Select
                        options={props.options.sortOptions()}
                        value={props.options.sortKey()}
                        onChange={props.options.setSortKey}
                        class={styles.select}
                      />
                    </div>
                    <RadioGroup
                      name="sortDirection"
                      options={[
                        { value: 'asc', label: 'Asc' },
                        { value: 'desc', label: 'Desc' },
                      ]}
                      value={props.options.sortDirection()}
                      onChange={props.options.setSortDirection}
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
                    props.options.setLocation(option.value);
                  },
                  selected: option.value === props.options.location(),
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
                    props.options.setTag(option.value);
                  },
                  selected: option.value === props.options.tag(),
                }))}
                showEmptyValueRows
              />
            </div>
          </Match>
          <Match when={view() === 'map'} keyed>
            <WorldMap
              locations={props.data.locationInfos}
              class={styles.worldMap}
              onSelectLocation={props.options.setLocation}
              currentLocation={props.options.location()}
              discoveredLocations={props.data.locationInfos.map(({ title }) => title)}
            />
          </Match>
        </Switch>
      </Show>
    </Frame>
  );
};

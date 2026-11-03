import { createMediaQuery } from '@solid-primitives/media';
import { makePersisted } from '@solid-primitives/storage';
import { createAsync, useSearchParams } from '@solidjs/router';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import { ASC_OPTION, DESC_OPTION } from '../../../core/entities/option.ts';
import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.ts';
import { compareCommentsByDatetime } from '../../../core/entities/comment.ts';
import type { DateRange } from '../../../core/utils/common-types.ts';
import {
  dateRangeToString,
  dateToString,
  formatDate,
  isDateInRange,
  stringToDateRange,
} from '../../../core/utils/date-utils.ts';
import { services } from '../../../core/services/index.ts';
import { AppPage } from '../../components/App/App.tsx';
import { Button } from '../../components/Button/Button.tsx';
import { Checkbox } from '../../components/Checkbox/Checkbox.tsx';
import { CommentPreviews } from '../../components/CommentPreviews/CommentPreviews.tsx';
import { DatePicker } from '../../components/DatePicker/DatePicker.tsx';
import { Divider } from '../../components/Divider/Divider.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import { Input } from '../../components/Input/Input.tsx';
import { RadioGroup } from '../../components/RadioGroup/RadioGroup.tsx';
import { Select } from '../../components/Select/Select.tsx';
import { texts } from '../../texts/index.ts';
import { currentLocale, localField, localize } from '../../utils/intl-utils.ts';
import type { CommentsPageData, CommentsPageSearchParams } from './CommentsPage.data.ts';
import { queryCommentsPageData } from './CommentsPage.data.ts';
import styles from './CommentsPage.module.css';

export const CommentsPage: SiteRoutePage<SiteRouteParams, CommentsPageData> = () => {
  const data = createAsync(() => queryCommentsPageData());
  const [searchParams, setSearchParams] = useSearchParams<CommentsPageSearchParams>();
  const [pageScrollTarget, setPageScrollTarget] = createSignal<HTMLElement>();
  const [commentsScrollTarget, setCommentsScrollTarget] = createSignal<HTMLDivElement>();
  const [commentsScrollReady, setCommentsScrollReady] = createSignal(false);
  const narrowScreen = createMediaQuery('(max-width: 811px)');
  const [expandFiltersOnNarrowScreen, setExpandFiltersOnNarrowScreen] = makePersisted(createSignal(false), {
    name: 'comments.expandFiltersOnNarrowScreen',
  });
  const search = () => searchParams.search ?? '';
  const service = () => searchParams.service;
  const author = () => searchParams.author;
  const dateRange = createMemo<DateRange | undefined>(() =>
    searchParams.date ? stringToDateRange(searchParams.date) : undefined,
  );
  const sortDirection = () => (searchParams.sort === 'asc' ? 'asc' : 'desc');
  const filtersExpanded = () => !narrowScreen() || expandFiltersOnNarrowScreen();
  const listScrollTarget = () => (narrowScreen() ? pageScrollTarget() : commentsScrollTarget());
  const hasActiveFilters = () =>
    Boolean(
      searchParams.author || searchParams.date || searchParams.service || searchParams.search || searchParams.sort,
    );

  const setSearch = (value: string) => setSearchParams({ search: value || undefined });
  const setService = (value: string | undefined) => setSearchParams({ service: value });
  const setAuthor = (value: string | undefined) => setSearchParams({ author: value });
  const setDateRange = (value: DateRange | undefined) =>
    setSearchParams({ date: value ? dateRangeToString(value) : undefined });
  const setSortDirection = (value: 'asc' | 'desc') => setSearchParams({ sort: value });
  const resetFilters = () =>
    setSearchParams({ author: undefined, date: undefined, service: undefined, search: undefined, sort: undefined });

  createEffect(() => {
    const target = listScrollTarget();
    if (!target) {
      return;
    }

    const update = () => {
      if (target.clientHeight > 0) {
        setCommentsScrollReady(true);
      }
    };

    const observer = new ResizeObserver(update);
    observer.observe(target);
    update();

    onCleanup(() => observer.disconnect());
  });

  const authorOptions = createMemo(() => {
    const userInfos = new Map((data()?.userInfos ?? []).map((info) => [info.id, info]));
    const authorCounts = new Map<string, number>();

    for (const info of data()?.commentInfos ?? []) {
      authorCounts.set(info.author, (authorCounts.get(info.author) ?? 0) + 1);
    }

    return [
      { value: undefined, label: texts.common.all },
      ...[...authorCounts]
        .map(([id, count]) => {
          const userInfo = userInfos.get(id);

          return { id, count, title: localField(userInfo, 'title') || id };
        })
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ id, count, title }) => ({ value: id, label: `${title} (${count})` })),
    ];
  });

  const serviceOptions = createMemo(() => [
    { value: undefined, label: texts.common.all },
    ...[...new Set((data()?.commentInfos ?? []).map((info) => info.service))]
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({
        value: id,
        label: services.find((item) => item.id === id)?.name ?? id,
      })),
  ]);

  const filteredCommentInfos = createMemo(() => {
    const searchTerm = search().trim().toLocaleLowerCase();

    return (data()?.commentInfos ?? [])
      .filter((info) => {
        if (author() && info.author !== author()) {
          return false;
        }

        const selectedDateRange = dateRange();
        if (selectedDateRange && !isDateInRange(info.datetime, selectedDateRange, 'date')) {
          return false;
        }

        if (service() && info.service !== service()) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        return [info.text, info.author, info.title, info.titleRu, info.service]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLocaleLowerCase().includes(searchTerm));
      })
      .sort(compareCommentsByDatetime(sortDirection()));
  });

  const commentsSummary = createMemo(() => {
    const result = [
      localize(texts.app.commentsSummary, {
        shown: filteredCommentInfos().length,
        total: data()?.commentInfos.length ?? 0,
      }),
    ];

    if (author()) {
      const authorInfo = data()?.userInfos.find((info) => info.id === author());
      result.push(localize(texts.postFilter.byUser, { user: localField(authorInfo, 'title') || author() }));
    }

    const selectedDateRange = dateRange();
    if (selectedDateRange) {
      const [start, end] = selectedDateRange;
      if (end && dateToString(start) !== dateToString(end)) {
        result.push(
          localize(texts.postFilter.postedFromTo, {
            from: formatDate(start, currentLocale()),
            to: formatDate(end, currentLocale()),
          }),
        );
      } else {
        result.push(localize(texts.postFilter.postedOn, { date: formatDate(start, currentLocale()) }));
      }
    }

    if (service()) {
      const label = serviceOptions().find((option) => option.value === service())?.label;
      result.push(
        localize(texts.commentFilter.withService, { service: typeof label === 'string' ? label : service() }),
      );
    }

    if (search()) {
      result.push(localize(texts.commentFilter.withSearch, { search: search() }));
    }

    if (searchParams.sort === 'asc' || searchParams.sort === 'desc') {
      result.push(
        localize(texts.commentFilter.sorted, {
          direction: localize(sortDirection() === 'asc' ? texts.postFilter.asc : texts.postFilter.desc),
        }),
      );
    }

    return result.join(' ');
  });

  return (
    <>
      <AppPage
        title={localize(texts.app.comments)}
        description={localize(texts.app.commentsDescription)}
        loading={!data()}
      />

      <Show when={data()}>
        {(_pageData) => (
          <main class={styles.container} ref={setPageScrollTarget}>
            <Frame component="aside" class={styles.filters}>
              <Show when={narrowScreen()}>
                <div class={styles.filterHeader}>
                  <Checkbox
                    name="expandCommentFilters"
                    value={expandFiltersOnNarrowScreen()}
                    onChange={setExpandFiltersOnNarrowScreen}
                    trueLabel={localize(texts.filtering.collapse)}
                    falseLabel={localize(texts.filtering.expand)}
                  />
                </div>
              </Show>
              <Show when={filtersExpanded()}>
                <div class={styles.filterControls}>
                  <div class={styles.filter}>
                    <span>{localize(texts.field.date)}</span>
                    <DatePicker
                      class={styles.filterControl}
                      emptyLabel={localize(texts.common.all)}
                      period
                      value={dateRange()}
                      onChange={setDateRange}
                    />
                  </div>
                  <label class={styles.filter}>
                    <span>{localize(texts.user.commenter)}</span>
                    <Select
                      class={styles.filterControl}
                      name="author"
                      options={authorOptions()}
                      value={author()}
                      onChange={setAuthor}
                    />
                  </label>
                </div>
              </Show>
            </Frame>
            <Frame component="section" class={styles.content}>
              <div class={styles.filterbar}>
                <RadioGroup
                  name="commentService"
                  options={serviceOptions()}
                  value={service()}
                  onChange={setService}
                  class={styles.services}
                />
                <div class={styles.searchWrapper}>
                  <Input
                    class={styles.searchInput}
                    name="search"
                    type="search"
                    onDebouncedChange={setSearch}
                    value={search()}
                  />
                  <Show when={search()}>
                    <Button type="button" onClick={() => setSearch('')}>
                      {localize(texts.filtering.clear)}
                    </Button>
                  </Show>
                </div>
                <div class={styles.sort}>
                  <span>{localize(texts.field.date)}</span>
                  <RadioGroup
                    name="sortDirection"
                    options={[ASC_OPTION, DESC_OPTION]}
                    value={sortDirection()}
                    onChange={(value) => (value === 'asc' || value === 'desc') && setSortDirection(value)}
                    class={styles.sortDirection}
                  />
                </div>
              </div>
              <Divider class={styles.toolbarDivider} />
              <div class={styles.resultbar}>
                <p class={styles.summary}>{commentsSummary()}</p>
                <Show when={hasActiveFilters()}>
                  <Button type="button" onClick={resetFilters}>
                    {localize(texts.filtering.resetOptions)}
                  </Button>
                </Show>
              </div>
              <Divider class={styles.commentsDivider} />
              <div class={styles.comments} ref={setCommentsScrollTarget}>
                <Show when={listScrollTarget() && commentsScrollReady()}>
                  <CommentPreviews
                    commentInfos={filteredCommentInfos()}
                    frameVariant={null}
                    scrollTarget={listScrollTarget()}
                  />
                </Show>
              </div>
            </Frame>
          </main>
        )}
      </Show>
    </>
  );
};

export default CommentsPage;

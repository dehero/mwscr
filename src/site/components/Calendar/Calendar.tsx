import clsx from 'clsx';
import { createEffect, createSignal, Match, Switch } from 'solid-js';
import type { DateRange } from '../../../core/utils/common-types.js';
import { getDecade, getDecadeYearRange } from '../../../core/utils/date-utils.js';
import { ArrowIcon } from '../ArrowIcon/ArrowIcon.jsx';
import { Button } from '../Button/Button.jsx';
import styles from './Calendar.module.css';
import { Decade } from './Decade.jsx';
import { Month } from './Month.jsx';
import { Year } from './Year.jsx';

export interface CalendarProps<
  TPeriod extends boolean | undefined,
  TValue = TPeriod extends undefined | false ? Date : DateRange,
> {
  class?: string;
  value?: TValue;
  onChange?: (value: TValue | undefined) => void;
  period: TPeriod;
}

export function Calendar<TPeriod extends boolean | undefined>(props: CalendarProps<TPeriod>) {
  const [selectedRange, setSelectedRange] = createSignal<DateRange | undefined>(
    Array.isArray(props.value) ? props.value : props.value ? [props.value, undefined] : undefined,
  );

  const [viewDate, setViewDate] = createSignal(
    selectedRange()
      ? new Date(Date.UTC(selectedRange()![0].getUTCFullYear(), selectedRange()![0].getUTCMonth(), 1))
      : new Date(),
  );
  const [view, setView] = createSignal('month');

  const title = () => {
    switch (view()) {
      case 'month':
        return viewDate().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      case 'year':
        return viewDate().toLocaleDateString('en-GB', { year: 'numeric' });
      case 'decade':
        return getDecadeYearRange(getDecade(viewDate())).join('-');
      default:
        return 'Error';
    }
  };

  const createViewDateChanger = (delta: number) => (e: Event) => {
    e.preventDefault();
    const date = new Date(viewDate());

    switch (view()) {
      case 'month':
        date.setUTCMonth(date.getUTCMonth() + delta, 1);
        break;
      case 'year':
        date.setUTCFullYear(date.getUTCFullYear() + delta, 0, 1);
        break;
      case 'decade':
        date.setUTCFullYear(getDecadeYearRange(getDecade(date) + delta)[0], 0, 1);
        break;
      default:
    }

    setViewDate(date);
  };

  const handleTitleClick = (e: Event) => {
    e.preventDefault();

    switch (view()) {
      case 'month':
        setView('year');
        break;
      case 'year':
        setView('decade');
        break;
      default:
    }
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(Date.UTC(year, 0, 1)));
    setView('year');
  };

  const handleMonthIndexSelect = (monthIndex: number) => {
    setViewDate(new Date(Date.UTC(viewDate().getFullYear(), monthIndex, 1)));
    setView('month');
  };

  const handleDateSelect = (date: Date) => {
    if (props.period) {
      const [start, end] = Array.isArray(props.value) ? props.value : [];
      let newValue: DateRange;

      if (start && !end) {
        newValue = date < start ? [date, start] : [start, date];
      } else {
        newValue = [date, undefined];
      }

      setSelectedRange(newValue);
      props.onChange?.(newValue as typeof props.value);
    } else {
      setSelectedRange([date, undefined]);
      props.onChange?.(date as typeof props.value);
    }
  };

  createEffect(() => {
    if (Array.isArray(props.value)) {
      setSelectedRange(props.value);
    } else {
      setSelectedRange(props.value ? [props.value, undefined] : undefined);
    }
  });

  return (
    <div class={clsx(styles.calendar, props.class)}>
      <div class={styles.label}>{props.period ? 'Pick date period' : 'Pick date'}</div>
      <div class={styles.header}>
        <Button onClick={createViewDateChanger(-1)}>
          <ArrowIcon direction="left" />
        </Button>
        <Button onClick={handleTitleClick}>{title()}</Button>
        <Button onClick={createViewDateChanger(1)}>
          <ArrowIcon direction="right" />
        </Button>
      </div>
      <Switch>
        <Match when={view() === 'month'}>
          <Month
            year={viewDate().getUTCFullYear()}
            monthIndex={viewDate().getUTCMonth()}
            selectedRange={selectedRange()}
            onDateSelect={handleDateSelect}
          />
        </Match>
        <Match when={view() === 'year'}>
          <Year
            year={viewDate().getUTCFullYear()}
            selectedRange={selectedRange()}
            onMonthIndexSelect={handleMonthIndexSelect}
          />
        </Match>
        <Match when={view() === 'decade'}>
          <Decade decade={getDecade(viewDate())} selectedRange={selectedRange()} onYearSelect={handleYearSelect} />
        </Match>
      </Switch>
    </div>
  );
}

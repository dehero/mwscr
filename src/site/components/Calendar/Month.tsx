import { type Component, For } from 'solid-js';
import type { DateRange } from '../../../core/utils/common-types.js';
import { isDateInRange } from '../../../core/utils/date-utils.js';
import { Button } from '../Button/Button.jsx';
import styles from './Calendar.module.css';

export interface MonthProps {
  year: number;
  monthIndex: number;
  onDateSelect?: (date: Date) => void;
  selectedRange?: DateRange;
}

export const Month: Component<MonthProps> = (props) => {
  const startDate = () => {
    const date = new Date(Date.UTC(props.year, props.monthIndex, 1));
    date.setUTCDate(date.getUTCDate() - date.getUTCDay());
    return date;
  };

  const endDate = () => {
    const date = new Date(Date.UTC(props.year, props.monthIndex + 1, 0));
    date.setUTCDate(date.getUTCDate() + (6 - date.getUTCDay()));
    return date;
  };

  const dates = () => {
    const days = [];
    for (let date = startDate(); date <= endDate(); date.setUTCDate(date.getUTCDate() + 1)) {
      days.push(new Date(date));
    }
    return days;
  };

  const weekDays = () =>
    dates()
      .slice(0, 7)
      .map((date) => date.toLocaleDateString('en-GB', { weekday: 'short' }));

  return (
    <div class={styles.month}>
      <For each={weekDays()}>{(date) => <div class={styles.weekDay}>{date}</div>}</For>
      <For each={dates()}>
        {(date) => (
          <Button
            active={props.selectedRange && isDateInRange(date, props.selectedRange, 'date')}
            onClick={(e: Event) => {
              e.preventDefault();
              props.onDateSelect?.(date);
            }}
          >
            {date.getUTCDate()}
          </Button>
        )}
      </For>
    </div>
  );
};

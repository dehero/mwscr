import { type Component, For } from 'solid-js';
import type { DateRange } from '../../../core/utils/common-types.js';
import { isDateInRange } from '../../../core/utils/date-utils.js';
import { Button } from '../Button/Button.jsx';
import styles from './Calendar.module.css';

export interface YearProps {
  year: number;
  onMonthIndexSelect?: (monthIndex: number) => void;
  selectedRange?: DateRange;
}

export const Year: Component<YearProps> = (props) => {
  const dates = () => {
    const result = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      result.push(new Date(Date.UTC(props.year, monthIndex, 1)));
    }
    return result;
  };

  return (
    <div class={styles.year}>
      <For each={dates()}>
        {(date) => (
          <Button
            active={props.selectedRange && isDateInRange(date, props.selectedRange, 'month')}
            onClick={(e: Event) => {
              e.preventDefault();
              props.onMonthIndexSelect?.(date.getUTCMonth());
            }}
          >
            {date.toLocaleDateString('en-GB', { month: 'long' })}
          </Button>
        )}
      </For>
    </div>
  );
};

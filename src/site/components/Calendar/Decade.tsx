import { type Component, For } from 'solid-js';
import type { DateRange } from '../../../core/utils/common-types.js';
import { getDecadeYearRange, isDateInRange } from '../../../core/utils/date-utils.js';
import { Button } from '../Button/Button.jsx';
import styles from './Calendar.module.css';

export interface DecadeProps {
  decade: number;
  onYearSelect?: (year: number) => void;
  selectedRange?: DateRange;
}

export const Decade: Component<DecadeProps> = (props) => {
  const dates = () => {
    const result = [];
    const [startYear, endYear] = getDecadeYearRange(props.decade);
    for (let year = startYear; year <= endYear; year++) {
      result.push(new Date(Date.UTC(year, 0, 1)));
    }
    return result;
  };

  return (
    <div class={styles.decade}>
      <For each={dates()}>
        {(date) => (
          <Button
            active={props.selectedRange && isDateInRange(date, props.selectedRange, 'year')}
            onClick={(e: Event) => {
              e.preventDefault();
              props.onYearSelect?.(date.getUTCFullYear());
            }}
          >
            {date.toLocaleDateString('en-GB', { year: 'numeric' })}
          </Button>
        )}
      </For>
    </div>
  );
};

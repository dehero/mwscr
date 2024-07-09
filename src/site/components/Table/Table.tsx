import clsx from 'clsx';
import { type Component, For, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { formatDate } from '../../../core/utils/date-utils.js';
import styles from './Table.module.css';

type TableValue = string | number | Date | (() => JSX.Element) | undefined;

export interface TableRow {
  label?: string;
  value?: TableValue;
  link?: string;
}

interface TableProps extends TableRow {
  class?: string;
  rows: TableRow[];
  lightLabels?: boolean;
}

function renderValue(value: TableValue) {
  if (typeof value === 'function') {
    return value();
  }
  if (value instanceof Date) {
    return formatDate(value);
  }

  return value?.toString() || '';
}

export const Table: Component<TableProps> = (props) => {
  const rows = () => props.rows.filter((row) => row.value);

  return (
    <div class={clsx(styles.table, props.class)} role="table">
      <Show when={props.label || props.value}>
        <div class={styles.header} role="rowgroup">
          <Dynamic
            component={props.link ? 'a' : 'tr'}
            href={props.link}
            class={clsx(styles.row, props.link && styles.link)}
            role="row"
          >
            <div class={styles.label} role="columnheader">
              {props.label}
            </div>
            <div class={styles.value} role="columnheader">
              {renderValue(props.value)}
            </div>
          </Dynamic>
        </div>
      </Show>
      <Show when={rows().length > 0}>
        <div class={styles.body} role="rowgroup">
          <For each={rows()}>
            {(row) => (
              <Dynamic
                component={row.link ? 'a' : 'tr'}
                href={row.link}
                class={clsx(styles.row, row.link && styles.link)}
                role="row"
              >
                <div class={clsx(styles.label, props.lightLabels && styles.lightLabel)} role="cell">
                  {row.label}
                </div>
                <div class={styles.value} role="cell">
                  {renderValue(row.value)}
                </div>
              </Dynamic>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

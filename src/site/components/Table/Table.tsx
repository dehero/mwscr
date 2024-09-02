import clsx from 'clsx';
import { type Component, createMemo, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { clientOnly } from 'vike-solid/clientOnly';
import { formatDate } from '../../../core/utils/date-utils.js';
import { Body } from './Body.jsx';
import styles from './Table.module.css';

const ClientVirtualBody = clientOnly(() => import('./VirtualBody.js'));

type TableValue = string | number | Date | (() => JSX.Element) | undefined;

export interface TableRow {
  label?: string;
  labelIcon?: JSX.Element;
  value?: TableValue;
  valueIcon?: JSX.Element;
  link?: string;
  tooltip?: (forRef: HTMLElement) => JSX.Element;
}

export interface TableProps extends TableRow {
  class?: string;
  rows: TableRow[];
  lightLabels?: boolean;
  scrollTarget?: HTMLElement;
  showEmptyValueRows?: boolean;
}

export function renderValue(value: TableValue) {
  if (typeof value === 'function') {
    return value();
  }
  if (value instanceof Date) {
    return formatDate(value);
  }

  return value?.toString() || '';
}

export const Table: Component<TableProps> = (props) => {
  const rows = createMemo(() => (!props.showEmptyValueRows ? props.rows.filter((row) => row.value) : props.rows));

  return (
    <div class={clsx(styles.table, props.class)} role="table">
      <Show when={props.label || props.value}>
        <div class={styles.header} role="rowgroup">
          <Dynamic
            component={props.link ? 'a' : 'div'}
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

      <ClientVirtualBody {...props} rows={rows()} fallback={<Body {...props} rows={rows()} />} />
    </div>
  );
};

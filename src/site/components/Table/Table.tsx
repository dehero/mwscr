import clsx from 'clsx';
import { type Component, createEffect, createMemo, type JSX, on, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { formatDate } from '../../../core/utils/date-utils.ts';
import { currentLocale } from '../../utils/intl-utils.ts';
import styles from './Table.module.css';
import VirtualBody from './VirtualBody.tsx';

type TableValue = string | number | Date | (() => JSX.Element) | undefined;

export const TABLE_ITEM_HEIGHT = 20;

export interface TableRow {
  label?: string;
  labelIcon?: JSX.Element;
  value?: TableValue;
  valueIcon?: JSX.Element;
  link?: string;
  linkTarget?: '_blank' | '_self' | '_parent' | '_top';
  selected?: boolean;
  onClick?: (e: Event) => void;
  tooltip?: (forRef: HTMLElement) => JSX.Element;
}

export interface TableProps extends TableRow {
  class?: string;
  rows: TableRow[];
  lightLabels?: boolean;
  scrollTarget?: HTMLElement;
  showEmptyValueRows?: boolean;
  shrink?: 'label' | 'value';
}

export function renderValue(value: TableValue) {
  if (typeof value === 'function') {
    return value();
  }
  if (value instanceof Date) {
    return formatDate(value, currentLocale());
  }

  return value?.toString() || '';
}

export const Table: Component<TableProps> = (props) => {
  const rows = createMemo(() => (!props.showEmptyValueRows ? props.rows.filter((row) => row.value) : props.rows));
  const hasHeader = () => Boolean(props.label || props.value);
  const selectedIndex = createMemo(() => rows().findIndex((row) => row.selected));
  let ref: HTMLDivElement | undefined;

  const scrollToIndex = (index: number) => {
    const scrollTarget = props.scrollTarget;

    if (index < 0 || !scrollTarget || !ref) {
      return;
    }

    const rowTop =
      ref.getBoundingClientRect().top -
      scrollTarget.getBoundingClientRect().top +
      scrollTarget.scrollTop +
      (hasHeader() ? TABLE_ITEM_HEIGHT : 0) +
      index * TABLE_ITEM_HEIGHT;
    const viewTop = scrollTarget.scrollTop;
    const viewBottom = viewTop + scrollTarget.clientHeight;

    if (rowTop >= viewTop && rowTop + TABLE_ITEM_HEIGHT <= viewBottom) {
      return;
    }

    scrollTarget.scrollTo({
      top: rowTop - Math.floor((scrollTarget.clientHeight - TABLE_ITEM_HEIGHT) / 2),
      left: scrollTarget.scrollLeft,
      behavior: 'smooth',
    });
  };

  const handleInitialize = () => {
    scrollToIndex(selectedIndex());
  };

  createEffect(on(selectedIndex, scrollToIndex, { defer: true }));

  return (
    <div
      class={clsx(styles.table, props.shrink && styles[`shrink_${props.shrink}`], props.class)}
      role="table"
      ref={ref}
    >
      <Show when={hasHeader()}>
        <div class={styles.header} role="rowgroup">
          <Dynamic
            component={props.link ? 'a' : 'div'}
            href={props.link}
            class={clsx(styles.row, props.link && styles.link)}
            role="row"
            target={props.linkTarget}
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

      <VirtualBody {...props} rows={rows()} onInitialize={handleInitialize} />
    </div>
  );
};

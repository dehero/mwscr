import clsx from 'clsx';
import { type Component, createMemo, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { clientOnly } from 'vike-solid/clientOnly';
import { formatDate } from '../../../core/utils/date-utils.js';
import { Body } from './Body.jsx';
import styles from './Table.module.css';

const ClientVirtualBody = clientOnly(() => import('./VirtualBody.js'));

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
    return formatDate(value);
  }

  return value?.toString() || '';
}

export const Table: Component<TableProps> = (props) => {
  const rows = createMemo(() => (!props.showEmptyValueRows ? props.rows.filter((row) => row.value) : props.rows));
  const hasHeader = () => Boolean(props.label || props.value);
  let ref: HTMLDivElement | undefined;

  const handleInitialize = () => {
    const index = props.rows.findIndex((row) => row.selected);

    if (index > -1 && props.scrollTarget && ref) {
      props.scrollTarget.scrollTo({
        top:
          index * TABLE_ITEM_HEIGHT +
          (hasHeader() ? TABLE_ITEM_HEIGHT : 0) +
          ref.offsetTop -
          Math.floor(props.scrollTarget.clientHeight / 2),
        left: props.scrollTarget.scrollTop,
        behavior: 'smooth',
      });
    }
  };

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

      <ClientVirtualBody
        {...props}
        rows={rows()}
        onInitialize={handleInitialize}
        fallback={<Body {...props} rows={rows()} onInitialize={handleInitialize} />}
      />
    </div>
  );
};

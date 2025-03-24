import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { TableRow } from './Table.js';
import { renderValue } from './Table.js';
import styles from './Table.module.css';

export interface RowProps {
  class?: string;
  style?: JSX.CSSProperties;
  tabIndex?: number;
  row: TableRow;
  lightLabels?: boolean;
}

export const Row: Component<RowProps> = (props) => {
  let ref;

  return (
    <>
      <Dynamic
        component={props.row.link ? 'a' : 'div'}
        href={props.row.link}
        class={clsx(
          styles.row,
          props.row.link && styles.link,
          (props.row.link || props.row.onClick) && styles.active,
          props.row.selected && styles.selected,
          props.class,
        )}
        role="row"
        ref={ref}
        style={props.style}
        tabIndex={props.tabIndex}
        onClick={props.row.onClick}
        target={props.row.linkTarget}
      >
        <div class={clsx(styles.label, props.lightLabels && styles.lightLabel)} role="cell">
          <Show when={props.row.labelIcon}>
            <span class={styles.icon}>{props.row.labelIcon}</span>
          </Show>
          {props.row.label}
        </div>
        <div class={styles.value} role="cell">
          <Show when={props.row.valueIcon}>
            <span class={styles.icon}>{props.row.valueIcon}</span>
          </Show>
          {renderValue(props.row.value)}
        </div>
      </Dynamic>
      {props.row.tooltip && <Show when={ref}>{props.row.tooltip(ref!)}</Show>}
    </>
  );
};

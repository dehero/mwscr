import clsx from 'clsx';
import { type Component, For, type JSX, Show, splitProps } from 'solid-js';
import styles from './Table.module.css';

export interface TableRow {
  label?: string;
  value?: string | number | (() => JSX.Element);
}

interface TableProps extends TableRow {
  class?: string;
  rows: TableRow[];
  lightLabels?: boolean;
}

export const Table: Component<TableProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'rows', 'label', 'value', 'lightLabels']);
  const rows = () => local.rows.filter((row) => row.value);

  return (
    <table class={clsx(styles.table, local.class)} {...rest}>
      <Show when={local.label || local.value}>
        <thead class={styles.header}>
          <tr>
            <th class={styles.label}>{local.label}</th>
            <th class={styles.value}>{typeof local.value === 'function' ? local.value() : local.value}</th>
          </tr>
        </thead>
      </Show>
      <Show when={rows().length > 0}>
        <tbody>
          <For each={rows()}>
            {(row) => (
              <tr>
                <td class={clsx(styles.label, local.lightLabels && styles.lightLabel)}>{row.label}</td>
                <td class={styles.value}>{typeof row.value === 'function' ? row.value() : row.value}</td>
              </tr>
            )}
          </For>
        </tbody>
      </Show>
    </table>
  );
};

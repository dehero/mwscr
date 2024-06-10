import clsx from 'clsx';
import { type Component, For, type JSX, Show, splitProps } from 'solid-js';
import styles from './Table.module.css';

export interface TableRow {
  label?: string;
  value?: string | number | Date | (() => JSX.Element);
  link?: string;
}

interface TableProps extends TableRow {
  class?: string;
  rows: TableRow[];
  lightLabels?: boolean;
}

function valueToString(value: string | number | Date | undefined): string {
  if (value instanceof Date) {
    return value.toLocaleDateString('en-GB');
  }
  return value?.toString() || '';
}

export const Table: Component<TableProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'rows', 'label', 'value', 'lightLabels', 'link']);
  const rows = () => local.rows.filter((row) => row.value);

  return (
    <table class={clsx(styles.table, local.class)} {...rest}>
      <Show when={local.label || local.value}>
        <thead class={styles.header}>
          <tr>
            <th class={styles.label}>{local.label}</th>
            <th class={styles.value}>
              <Show
                when={local.link}
                fallback={typeof local.value === 'function' ? local.value() : valueToString(local.value)}
              >
                <a href={local.link} class={styles.link}>
                  {typeof local.value === 'function' ? local.value() : valueToString(local.value)}
                </a>
              </Show>
            </th>
          </tr>
        </thead>
      </Show>
      <Show when={rows().length > 0}>
        <tbody>
          <For each={rows()}>
            {(row) => (
              <tr>
                <td class={clsx(styles.label, local.lightLabels && styles.lightLabel)}>{row.label}</td>
                <td class={styles.value}>
                  <Show
                    when={row.link}
                    fallback={typeof row.value === 'function' ? row.value() : valueToString(row.value)}
                  >
                    <a href={row.link} class={styles.link}>
                      {typeof row.value === 'function' ? row.value() : valueToString(row.value)}
                    </a>
                  </Show>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </Show>
    </table>
  );
};

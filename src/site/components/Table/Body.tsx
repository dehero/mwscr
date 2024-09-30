import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { Row } from './Row.jsx';
import type { TableRow } from './Table.js';
import styles from './Table.module.css';

export interface BodyProps {
  rows: TableRow[];
  lightLabels?: boolean;
  scrollTarget?: HTMLElement;
  onInitialize?: () => void;
}

export const Body: Component<BodyProps> = (props) => {
  return (
    <Show when={props.rows.length > 0}>
      <div class={styles.body} role="rowgroup">
        <For each={props.rows}>{(row) => <Row row={row} lightLabels={props.lightLabels} />}</For>
      </div>
    </Show>
  );
};

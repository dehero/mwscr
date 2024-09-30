import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { Body, type BodyProps } from './Body.jsx';
import { Row } from './Row.jsx';
import { TABLE_ITEM_HEIGHT, type TableRow } from './Table.js';
import styles from './Table.module.css';

function ListItem(props: VirtualItemProps<TableRow>) {
  return <Row style={props.style} class={styles.virtualItem} tabIndex={props.tabIndex} row={props.item} />;
}

export const VirtualBody: Component<BodyProps> = (props) => {
  const [initialized, setInitialized] = createSignal(false);

  createEffect(() => {
    if (initialized()) {
      onMount(() => props.onInitialize?.());
    }
  });

  return (
    <Show when={props.scrollTarget} fallback={<Body {...props} />}>
      <VirtualContainer
        className={styles.body}
        items={props.rows}
        scrollTarget={props.scrollTarget}
        itemSize={{ height: TABLE_ITEM_HEIGHT }}
        direction="vertical"
        role="rowgroup"
        crossAxisCount={() => {
          setInitialized(true);
          return 1;
        }}
      >
        {ListItem}
      </VirtualContainer>
    </Show>
  );
};

export default VirtualBody;

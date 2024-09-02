import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import { type Component, Show } from 'solid-js';
import { Body, type BodyProps } from './Body.jsx';
import { Row } from './Row.jsx';
import type { TableRow } from './Table.js';
import styles from './Table.module.css';

function ListItem(props: VirtualItemProps<TableRow>) {
  return <Row style={props.style} class={styles.virtualItem} tabIndex={props.tabIndex} row={props.item} />;
}

export const VirtualBody: Component<BodyProps> = (props) => {
  return (
    <Show when={props.scrollTarget} fallback={<Body {...props} />}>
      <VirtualContainer
        items={props.rows}
        scrollTarget={props.scrollTarget}
        itemSize={{ height: 20 }}
        direction="vertical"
        role="rowgroup"
      >
        {ListItem}
      </VirtualContainer>
    </Show>
  );
};

export default VirtualBody;

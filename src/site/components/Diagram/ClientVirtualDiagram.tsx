import type { VirtualItemProps } from '@minht11/solid-virtual-container';
import { VirtualContainer } from '@minht11/solid-virtual-container';
import clsx from 'clsx';
import { createContext, createSignal, mergeProps, useContext } from 'solid-js';
import { groupBy } from '../../../core/utils/common-utils.js';
import { Frame } from '../Frame/Frame.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import type {
  DiagramInterval,
  DiagramIntervalTooltipComponent,
  DiagramIntervalTooltipComponentProps,
  DiagramProps,
} from './Diagram.jsx';
import styles from './Diagram.module.css';

interface ClientVirtualDiagramContext {
  minValue: number;
  maxValue: number;
  baseValue: number;
  IntervalTooltipComponent: DiagramIntervalTooltipComponent<unknown>;
}

const ClientVirtualDiagramContext = createContext<ClientVirtualDiagramContext>({
  minValue: 0,
  maxValue: 0,
  baseValue: 0,
  IntervalTooltipComponent: DefaultIntervalTooltipComponent,
});

function ListItem<TItem>(props: VirtualItemProps<DiagramInterval<TItem>>) {
  const { baseValue, maxValue, IntervalTooltipComponent } = useContext(ClientVirtualDiagramContext);
  let ref;

  return (
    <div style={props.style} class={styles.virtualItem} tabIndex={props.tabIndex} role="listitem">
      <Frame
        class={styles.item}
        style={{ height: `${((props.item.value - baseValue) / (maxValue - baseValue || 1)) * 100}%` }}
        ref={ref}
      />
      <IntervalTooltipComponent forRef={ref} interval={props.item} />
    </div>
  );
}

function DefaultIntervalTooltipComponent(props: DiagramIntervalTooltipComponentProps<unknown>) {
  return (
    <Tooltip forRef={props.forRef}>
      <span>Label: {String(props.interval.interval)}</span>
      <span>Value: {props.interval.value}</span>
    </Tooltip>
  );
}

export function ClientVirtualDiagram<TItem>(props: DiagramProps<TItem>) {
  const merged = mergeProps({ IntervalTooltipComponent: DefaultIntervalTooltipComponent }, props);
  const [scrollTarget, setScrollTarget] = createSignal<HTMLElement | undefined>(undefined);

  const intervals = () =>
    [...groupBy(merged.items, merged.getItemInterval)].map(
      ([interval, items]): DiagramInterval<TItem> => ({
        interval,
        items,
        value: merged.getIntervalValue(interval, items),
      }),
    );

  const minValue = () => Math.min(...intervals().map((item) => item.value));
  const maxValue = () => Math.max(...intervals().map((item) => item.value));
  const baseValue = () =>
    merged.baseValue === 'minimal'
      ? minValue()
      : merged.baseValue === 'delta'
        ? minValue() - (maxValue() - minValue())
        : merged.baseValue || 0;

  return (
    <Frame class={clsx(styles.container, merged.class)} ref={setScrollTarget}>
      <ClientVirtualDiagramContext.Provider
        value={{
          minValue: minValue(),
          maxValue: maxValue(),
          baseValue: baseValue(),
          IntervalTooltipComponent: merged.IntervalTooltipComponent as DiagramIntervalTooltipComponent<unknown>,
        }}
      >
        <VirtualContainer
          items={intervals()}
          scrollTarget={scrollTarget()}
          itemSize={{ width: 12 }}
          direction="horizontal"
        >
          {ListItem}
        </VirtualContainer>
      </ClientVirtualDiagramContext.Provider>
    </Frame>
  );
}

export default ClientVirtualDiagram;

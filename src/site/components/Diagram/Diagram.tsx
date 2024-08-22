import clsx from 'clsx';
import type { Component } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import { Frame } from '../Frame/Frame.jsx';
import styles from './Diagram.module.css';

const ClientVirtualDiagram = clientOnly(() => import('./ClientVirtualDiagram.js'));

export interface DiagramInterval<TItem> {
  interval: unknown;
  items: TItem[];
  value: number;
}

export interface DiagramIntervalTooltipComponentProps<TItem> {
  interval: DiagramInterval<TItem>;
  forRef?: Element;
}

export type DiagramIntervalTooltipComponent<TItem> = Component<DiagramIntervalTooltipComponentProps<TItem>>;

export interface DiagramProps<TItem> {
  class?: string;
  items: TItem[];
  getItemInterval: (item: TItem) => unknown;
  getIntervalValue: (interval: unknown, items: TItem[]) => number;
  IntervalTooltipComponent?: DiagramIntervalTooltipComponent<TItem>;
  baseValue?: number | 'minimal' | 'delta';
}

export function Diagram<TItem>(props: DiagramProps<TItem>) {
  return (
    <ClientVirtualDiagram
      {...(props as DiagramProps<unknown>)}
      fallback={<Frame class={clsx(styles.container, props.class)}></Frame>}
    />
  );
}

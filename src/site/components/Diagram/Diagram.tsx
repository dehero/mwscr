import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import { Frame } from '../Frame/Frame.jsx';
import styles from './Diagram.module.css';

const ClientVirtualDiagram = clientOnly(() => import('./ClientVirtualDiagram.js'));

export interface DiagramInterval<TItem> {
  interval: unknown;
  items: TItem[];
  value: number;
  link?: string;
}

export interface DiagramIntervalIconComponentProps<TItem> {
  interval: DiagramInterval<TItem>;
}

export interface DiagramIntervalTooltipComponentProps<TItem> {
  interval: DiagramInterval<TItem>;
  forRef?: Element;
}

export type DiagramIntervalIconComponent<TItem> = Component<DiagramIntervalIconComponentProps<TItem>>;

export type DiagramIntervalTooltipComponent<TItem> = Component<DiagramIntervalTooltipComponentProps<TItem>>;

export interface DiagramProps<TItem> {
  class?: string;
  label?: string;
  items: TItem[];
  getItemInterval: (item: TItem) => unknown;
  getIntervalValue: (interval: unknown, items: TItem[]) => number;
  getIntervalLink?: (interval: unknown, items: TItem[]) => string | undefined;
  IntervalIconComponent?: DiagramIntervalIconComponent<TItem>;
  IntervalTooltipComponent?: DiagramIntervalTooltipComponent<TItem>;
  baseValue?: number | 'minimal' | 'delta';
}

export function Diagram<TItem>(props: DiagramProps<TItem>) {
  return (
    <ClientVirtualDiagram
      {...(props as DiagramProps<unknown>)}
      fallback={
        <Frame class={clsx(styles.container, props.class)}>
          <Show when={props.label}>
            <p class={styles.label}>{props.label}</p>
          </Show>
        </Frame>
      }
    />
  );
}

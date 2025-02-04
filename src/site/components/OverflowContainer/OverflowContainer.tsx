import { createElementSize } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import { type Component, createSignal, type JSX, Show } from 'solid-js';
import styles from './OverflowContainer.module.css';

export interface OverflowContainerProps {
  children: JSX.Element;
  fallback: JSX.Element;
  containerClass?: string;
  class?: string;
}

export const OverflowContainer: Component<OverflowContainerProps> = (props) => {
  const [containerRef, setContainerRef] = createSignal<HTMLElement>();
  const [childrenRef, setChildrenRef] = createSignal<HTMLElement>();

  const size = createElementSize(containerRef);
  const isOverflowing = () => size.width && size.width < (childrenRef()?.clientWidth ?? 0);

  return (
    <div
      ref={setContainerRef}
      class={clsx(styles.container, isOverflowing() && styles.isOverflowing, props.containerClass)}
    >
      <Show when={isOverflowing()}>{props.fallback}</Show>
      <div class={clsx(styles.children, props.class)} ref={setChildrenRef}>
        {props.children}
      </div>
    </div>
  );
};

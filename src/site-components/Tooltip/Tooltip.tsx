import { createPositionToElement, useMousePosition } from '@solid-primitives/mouse';
import { createElementSize } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Frame } from '../Frame/Frame.js';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  class?: string;
  children?: JSX.Element;
  forRef?: Element;
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [target, setTarget] = createSignal<HTMLElement>();

  const size = createElementSize(target);

  const mouse = useMousePosition();
  const relative = createPositionToElement(
    () => props.forRef,
    () => mouse,
  );

  return (
    <Show when={relative.isInside}>
      <Portal>
        <Frame
          ref={setTarget}
          component="div"
          variant="thin"
          class={clsx(styles.tooltip, props.class)}
          style={{ transform: `translate(${mouse.x - (size.width ?? 0) / 2}px, ${mouse.y}px)` }}
        >
          {props.children}
        </Frame>
      </Portal>
    </Show>
  );
};

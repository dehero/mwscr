import { createPositionToElement, useMousePosition } from '@solid-primitives/mouse';
import { createElementSize } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Frame } from '../Frame/Frame.js';
import styles from './Tooltip.module.css';

const CURSOR_OFFSET_X = 8;
const CURSOR_OFFSET_Y = 32;
const CURSOR_SIZE = 16;

export interface TooltipProps {
  class?: string;
  children?: JSX.Element;
  forRef?: Element;
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [target, setTarget] = createSignal<HTMLElement>();
  const [isOverlapped, setIsOverlapped] = createSignal(false);

  const size = createElementSize(target);

  const mouse = useMousePosition();
  const relative = createPositionToElement(
    () => props.forRef,
    () => mouse,
  );

  createEffect(() => {
    if (props.forRef) {
      setIsOverlapped(!document.elementsFromPoint(mouse.x, mouse.y).includes(props.forRef));
    }
  });

  return (
    <Show when={relative.isInside && !isOverlapped()}>
      <Portal>
        <Frame
          ref={setTarget}
          component="div"
          variant="thin"
          class={clsx(styles.tooltip, props.class)}
          style={{
            transform: `translate(${Math.min(
              Math.max(-CURSOR_OFFSET_X, mouse.x - (size.width ?? 0) / 2),
              window.innerWidth - (size.width ?? 0) - CURSOR_OFFSET_X,
            )}px, ${
              mouse.y + CURSOR_OFFSET_Y + (size.height ?? 0) > window.innerHeight
                ? mouse.y - CURSOR_OFFSET_Y + CURSOR_SIZE - (size.height ?? 0)
                : mouse.y + CURSOR_OFFSET_Y
            }px)`,
          }}
        >
          {props.children}
        </Frame>
      </Portal>
    </Show>
  );
};

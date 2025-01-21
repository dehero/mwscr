import { createMediaQuery } from '@solid-primitives/media';
import type { MousePositionInside, PositionRelativeToElement } from '@solid-primitives/mouse';
import { createPositionToElement, useMousePosition } from '@solid-primitives/mouse';
import { createElementSize } from '@solid-primitives/resize-observer';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Button } from '../Button/Button.jsx';
import { Frame } from '../Frame/Frame.js';
import styles from './Tooltip.module.css';

const CURSOR_OFFSET_X = 8;
const CURSOR_OFFSET_Y = 32;
const CURSOR_SIZE = 16;

export interface TooltipAction {
  label: string;
  url?: string;
  onClick?: () => void;
}

export interface TooltipProps {
  class?: string;
  children?: JSX.Element | ((position: PositionRelativeToElement) => JSX.Element);
  actions?: TooltipAction[];
  forRef?: Element;
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [tooltipRef, setTooltipRef] = createSignal<HTMLElement>();
  const noHoverDevice = createMediaQuery('(hover: none)');
  const [contextMenuPosition, setContextMenuPosition] = createSignal<MousePositionInside | null>(null);
  const [hideHover, setHideHover] = createSignal(false);

  const size = createElementSize(tooltipRef);
  const mousePosition = useMousePosition();
  const allowContextMenu = createMemo(() => noHoverDevice() || Boolean(props.actions?.length));
  const position = createMemo(() =>
    hideHover() ? null : noHoverDevice() ? contextMenuPosition() : contextMenuPosition() ?? mousePosition,
  );

  const relative = createPositionToElement(
    () => props.forRef,
    () => position() ?? mousePosition,
  );

  const mouseIsInside = () =>
    position() ? props.forRef?.contains(document.elementFromPoint(position()!.x, position()!.y)) : false;
  const invertedTooltipY = () => (position()?.y ?? 0) - CURSOR_OFFSET_Y + CURSOR_SIZE - (size.height ?? 0);
  const children = () => (typeof props.children === 'function' ? props.children(relative) : props.children);

  // Close context menu on document events
  createEffect(() => {
    if (!allowContextMenu() && !hideHover()) {
      return;
    }

    const handleInteraction = (e: Event) => {
      if (contextMenuPosition() && !tooltipRef()?.contains(e.target as Node)) {
        if (e.type === 'click') {
          e.preventDefault();
        }
        setContextMenuPosition(null);
      }
      setHideHover(false);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('touchmove', handleInteraction);
    document.addEventListener('mousewheel', handleInteraction);

    onCleanup(() => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchmove', handleInteraction);
      document.removeEventListener('mousewheel', handleInteraction);
    });
  });

  // Show context menu when contextmenu event triggered
  createEffect(() => {
    const handleContextmenu = (e: Event) => {
      // Show custom context menu if allowed
      if (props.forRef?.contains(e.target as Node)) {
        if (allowContextMenu()) {
          e.preventDefault();
          // Don't inherit reactivity
          setContextMenuPosition({ ...mousePosition });
          return false;
        }
        // Hide tooltip on hover when showing browser context menu
        setHideHover(true);
      }
      // Hide custom context menu if clicked outside
      if (!tooltipRef()?.contains(e.target as Node)) {
        setContextMenuPosition(null);
      }
      return undefined;
    };

    // TODO: iOS does not trigger contextmenu, add long press emulator
    document.addEventListener('contextmenu', handleContextmenu);

    onCleanup(() => document.removeEventListener('contextmenu', handleContextmenu));
  });

  return (
    <Show when={position() && mouseIsInside() && children()}>
      <Portal>
        <Frame
          ref={setTooltipRef}
          component="div"
          variant="thin"
          class={clsx(styles.tooltip, props.class)}
          style={{
            transform: `translate(${Math.min(
              Math.max(-CURSOR_OFFSET_X, position()!.x - (size.width ?? 0) / 2),
              window.innerWidth - (size.width ?? 0) - CURSOR_OFFSET_X,
            )}px, ${
              position()!.y + CURSOR_OFFSET_Y + (size.height ?? 0) > window.innerHeight && invertedTooltipY() > 0
                ? invertedTooltipY()
                : position()!.y + CURSOR_OFFSET_Y
            }px)`,
          }}
        >
          {children()}
          <Show when={props.actions && contextMenuPosition()}>
            <div class={styles.actions}>
              <For each={props.actions}>
                {(action) => (
                  <Button
                    href={action.url}
                    onClick={() => {
                      action.onClick?.();
                      setContextMenuPosition(null);
                    }}
                  >
                    {action.label}
                  </Button>
                )}
              </For>
            </div>
          </Show>
        </Frame>
      </Portal>
    </Show>
  );
};

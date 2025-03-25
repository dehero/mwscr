import clsx from 'clsx';
import { type Component, createEffect, type JSX, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Frame } from '../Frame/Frame.js';
import { Spacer } from '../Spacer/Spacer.js';
import styles from './Dialog.module.css';

export interface DialogProps {
  class?: string;
  children?: JSX.Element;
  title?: string;
  show: boolean;
  onClose: () => void;
  actions?: JSX.Element;
  summary?: JSX.Element;
  modal?: boolean;
}

export const Dialog: Component<DialogProps> = (props) => {
  let ref: HTMLDivElement | undefined;

  const handleClick = (event: MouseEvent) => {
    if (!ref?.contains(event.target as Node)) {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.show && !props.modal) {
      document.addEventListener('mousedown', handleClick);

      onCleanup(() => {
        document.removeEventListener('mousedown', handleClick);
      });
    }
  });

  return (
    <Show when={props.show}>
      <Portal>
        <div class={clsx(styles.backdrop, props.modal && styles.modal)}>
          <Frame ref={ref} variant={props.title ? 'thick' : null} class={clsx(styles.container, props.class)}>
            <Show when={props.title}>
              <div class={styles.header}>{props.title}</div>
            </Show>
            <Frame variant="thick" class={styles.body}>
              <div class={styles.content}>{props.children}</div>
              <Show when={props.actions || props.summary}>
                <div class={styles.footer}>
                  {props.summary}
                  <Spacer />
                  <div class={styles.actions}>{props.actions}</div>
                  <Show when={!props.title}>
                    <Spacer />
                  </Show>
                </div>
              </Show>
            </Frame>
          </Frame>
        </div>
      </Portal>
    </Show>
  );
};

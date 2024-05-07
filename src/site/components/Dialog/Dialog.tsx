import clsx from 'clsx';
import { type Component, createEffect, type JSX, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import frameStyles from '../Frame/Frame.module.css';
import styles from './Dialog.module.css';

export interface DialogProps {
  class?: string;
  children?: JSX.Element;
  title?: string;
  show: boolean;
  onClose: () => void;
  actions?: JSX.Element;
}

export const Dialog: Component<DialogProps> = (props) => {
  let ref: HTMLDivElement | undefined;

  const handleClick = (event: MouseEvent) => {
    if (!ref?.contains(event.target as Node)) {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.show) {
      document.addEventListener('mousedown', handleClick);

      onCleanup(() => {
        document.removeEventListener('mousedown', handleClick);
      });
    }
  });

  return (
    <Show when={props.show}>
      <Portal>
        <div class={styles.backdrop}>
          <div ref={ref} class={clsx(props.title && frameStyles.thick, styles.container, props.class)}>
            <Show when={props.title}>
              <div class={styles.header}>{props.title}</div>
            </Show>
            <div class={clsx(frameStyles.thick, styles.body)}>
              <div class={styles.content}>{props.children}</div>
              <Show when={props.actions}>
                <div class={styles.footer}>
                  <div class={styles.spacer} />
                  {props.actions}
                  <Show when={!props.title}>
                    <div class={styles.spacer} />
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

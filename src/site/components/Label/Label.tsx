import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './Label.module.css';

export interface LabelProps {
  class?: string;
  children?: JSX.Element;
  label?: string;
  vertical?: boolean;
  position?: 'start' | 'end';
}

export const Label: Component<LabelProps> = (props) => {
  return (
    <label class={clsx(styles.container, props.vertical && styles.vertical, props.class)}>
      <Show when={props.label && props.position !== 'end'}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      {props.children}
      <Show when={props.label && props.position === 'end'}>
        <span class={clsx(styles.label, styles.alignEnd)}>{props.label}</span>
      </Show>
    </label>
  );
};

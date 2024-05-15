import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import styles from './Label.module.css';

export interface LabelProps {
  class?: string;
  children?: JSX.Element;
  label?: string;
  vertical?: boolean;
}

export const Label: Component<LabelProps> = (props) => {
  return (
    <label class={clsx(styles.container, props.vertical && styles.vertical, props.class)}>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      {props.children}
    </label>
  );
};

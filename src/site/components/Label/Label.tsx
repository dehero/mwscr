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
      <Show when={props.label}>
        <span class={clsx(styles.label, props.position === 'end' && styles.alignEnd)}>{props.label}</span>
      </Show>
      {props.children}
    </label>
  );
};

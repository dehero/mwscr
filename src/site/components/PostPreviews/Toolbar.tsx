import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import { isJSXElementEmpty } from '../../utils/jsx-utils.js';
import styles from './PostPreviews.module.css';

export interface ToolbarProps {
  label?: string;
  actions?: JSX.Element;
  class?: string;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const withActions = () => !isJSXElementEmpty(props.actions);

  return (
    <div class={clsx(styles.toolbar, withActions() && styles.withActions, props.class)}>
      <Show when={withActions()}>
        <div class={styles.actions}>{props.actions}</div>
      </Show>
      <p class={styles.label}>{props.label}</p>
    </div>
  );
};

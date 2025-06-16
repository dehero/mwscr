import clsx from 'clsx';
import type { Component } from 'solid-js';
import styles from './UserPreviews.module.css';

export interface ToolbarProps {
  label?: string;
  class?: string;
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  return (
    <div class={clsx(styles.toolbar, props.class)}>
      <p class={styles.label}>{props.label}</p>
    </div>
  );
};

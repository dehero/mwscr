import clsx from 'clsx';
import type { Component } from 'solid-js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  maximum: number;
  class?: string;
}

export const ProgressBar: Component<ProgressBarProps> = (props) => {
  const percent = () => (props.value / props.maximum) * 100;

  return (
    <Frame class={clsx(styles.progressBar, props.class)}>
      <div class={styles.bar} style={{ width: `${percent()}%` }} />
    </Frame>
  );
};

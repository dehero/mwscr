import clsx from 'clsx';
import type { Component } from 'solid-js';
import styles from './GoldIcon.module.css';

export interface GoldIconProps {
  class?: string;
}

export const GoldIcon: Component<GoldIconProps> = (props) => {
  return <span class={clsx(styles.icon, props.class)} />;
};

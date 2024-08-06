import clsx from 'clsx';
import { type Component, mergeProps } from 'solid-js';
import styles from './ArrowIcon.module.css';

export interface ArrowIconProps {
  class?: string;
  direction: 'left' | 'up' | 'right' | 'down';
}

export const ArrowIcon: Component<ArrowIconProps> = (props) => {
  const merged = mergeProps({ direction: 'left' }, props);

  return <span class={clsx(styles.icon, props.class, styles[merged.direction])} />;
};

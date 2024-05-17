import clsx from 'clsx';
import { type Component, type JSX, mergeProps } from 'solid-js';
import styles from './Icon.module.css';

export interface IconProps {
  class?: string;
  children?: JSX.Element;
  size?: 'small' | 'medium' | 'large';
  color?: 'stealth' | 'combat' | 'attribute' | 'health' | 'magic' | 'fatigue';
  variant?: 'default' | 'flat';
}

export const Icon: Component<IconProps> = (props) => {
  const merged = mergeProps({ color: 'stealth', size: 'large', variant: 'default' }, props);

  return (
    <span class={clsx(styles.icon, styles[merged.size], styles[merged.color], styles[merged.variant], props.class)}>
      {props.children}
    </span>
  );
};

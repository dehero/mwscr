import clsx from 'clsx';
import { type Component, type JSX, splitProps } from 'solid-js';
import styles from './Divider.module.css';

export interface DividerProps extends JSX.CustomAttributes<HTMLHRElement>, JSX.DOMAttributes<HTMLHRElement> {
  class?: string;
}

export const Divider: Component<DividerProps> = (props) => {
  const [local, rest] = splitProps(props, ['class']);

  return <hr class={clsx(styles.divider, local.class)} {...rest} />;
};

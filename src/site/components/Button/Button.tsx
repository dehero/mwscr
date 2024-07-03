import clsx from 'clsx';
import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Button.module.css';

export type ButtonProps = (ComponentProps<'a'> | ComponentProps<'button'>) & {
  active?: boolean;
};

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'active']);
  return (
    <Frame<'a' | 'button'>
      variant="button"
      component={'href' in props && props.href ? 'a' : 'button'}
      class={clsx(styles.button, local.active && styles.buttonActive, local.class)}
      {...rest}
    />
  );
};

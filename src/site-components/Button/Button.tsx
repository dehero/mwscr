import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './Button.module.css';

interface ButtonProps {
  class?: string;
  children?: JSX.Element;
}

export const Button: Component<ButtonProps> = (props) => {
  return (
    <Frame variant="button" component="button" class={clsx(styles.button, props.class)}>
      {props.children}
    </Frame>
  );
};

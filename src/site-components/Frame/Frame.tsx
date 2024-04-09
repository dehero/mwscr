import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import styles from './Frame.module.css';

interface FrameProps {
  class?: string;
  children?: JSX.Element;
  variant: 'thin' | 'thick' | 'button';
  component?: keyof JSX.IntrinsicElements;
}

export const Frame: Component<FrameProps> = (props) => {
  return (
    <Dynamic component={props.component ?? 'div'} class={clsx(styles.frame, styles[props.variant], props.class)}>
      {props.children}
    </Dynamic>
  );
};

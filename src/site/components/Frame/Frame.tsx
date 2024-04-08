import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import styles from './Frame.module.css';

interface FrameProps {
  class?: string;
  children?: JSX.Element;
  variant: 'thin' | 'thick' | 'button';
}

export const Frame: Component<FrameProps> = ({ children, variant, ...props }) => {
  return <div class={clsx(styles.frame, styles[variant], props.class)}>{children}</div>;
};

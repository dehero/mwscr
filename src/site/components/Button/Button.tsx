import clsx from 'clsx';
import { type Component, type JSX, splitProps } from 'solid-js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './Button.module.css';

interface ButtonProps extends JSX.CustomAttributes<HTMLElement>, JSX.DOMAttributes<HTMLElement> {
  class?: string;
  children?: JSX.Element;
  href?: string;
  target?: string;
  active?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children', 'active']);
  return (
    <Frame
      variant="button"
      component={props.href ? 'a' : 'button'}
      class={clsx(styles.button, local.active && styles.buttonActive, local.class)}
      {...rest}
    >
      {local.children}
    </Frame>
  );
};

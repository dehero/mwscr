import clsx from 'clsx';
import { type Component, type JSX, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import styles from './Frame.module.css';

interface FrameProps extends JSX.CustomAttributes<HTMLElement>, JSX.DOMAttributes<HTMLElement> {
  class?: string;
  children?: JSX.Element;
  variant: 'thin' | 'thick' | 'button';
  component?: keyof JSX.IntrinsicElements;
}

export const Frame: Component<FrameProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children', 'variant', 'component']);
  return (
    <Dynamic
      component={local.component ?? 'div'}
      class={clsx(styles.frame, styles[local.variant], local.class)}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};

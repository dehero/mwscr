import clsx from 'clsx';
import { type Component, type JSX, mergeProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import styles from './Frame.module.css';

interface FrameProps extends JSX.CustomAttributes<HTMLElement>, JSX.DOMAttributes<HTMLElement> {
  id?: string;
  class?: string;
  children?: JSX.Element;
  variant?: 'thin' | 'thick' | 'button';
  component?: keyof JSX.IntrinsicElements;
  style?: JSX.CSSProperties | string;
  tabIndex?: number;
}

export const Frame: Component<FrameProps> = (props) => {
  const merged = mergeProps({ variant: 'thin', component: 'div' }, props);
  const [local, rest] = splitProps(merged, ['class', 'children', 'variant', 'component', 'style']);

  return (
    <Dynamic
      component={local.component}
      class={clsx(styles.frame, styles[local.variant], local.class)}
      style={local.style}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
};

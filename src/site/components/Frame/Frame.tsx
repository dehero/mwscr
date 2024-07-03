import clsx from 'clsx';
import type { ValidComponent } from 'solid-js';
import { mergeProps, splitProps } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';
import { Dynamic } from 'solid-js/web';
import styles from './Frame.module.css';

export type FrameProps<T extends ValidComponent> = Omit<DynamicProps<T>, 'class' | 'component'> & {
  component?: T;
  class?: string;
  variant?: 'thin' | 'thick' | 'button' | null;
};

export function Frame<T extends ValidComponent>(props: FrameProps<T>) {
  const merged = mergeProps({ variant: 'thin', component: 'div' }, props);
  const [local, rest] = splitProps(merged, ['class', 'variant', 'component']);

  return (
    <Dynamic<typeof local.component | 'div'>
      component={local.component ?? 'div'}
      class={clsx(styles.frame, local.variant && styles[local.variant], local.class)}
      {...rest}
    />
  );
}

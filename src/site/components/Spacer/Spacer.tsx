import type { Component, ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';
import { Dynamic } from 'solid-js/web';
import styles from './Spacer.module.css';

export type SpacerProps = Omit<DynamicProps<ValidComponent>, 'class'>;

export const Spacer: Component<SpacerProps> = (props) => {
  return <Dynamic component={props.component || 'div'} class={styles.spacer} />;
};

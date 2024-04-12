import { type Component } from 'solid-js';
import Content from '../../../CONTRIBUTING.md';
import styles from './Contributing.module.css';

export const Contributing: Component = () => {
  return (
    <section class={styles.container}>
      <Content class={styles.container} />
    </section>
  );
};

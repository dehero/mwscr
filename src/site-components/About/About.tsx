import { type Component } from 'solid-js';
import Content from '../../../README.md';
import styles from './About.module.css';

export const About: Component = () => {
  return (
    <section class={styles.container}>
      <Content />
    </section>
  );
};

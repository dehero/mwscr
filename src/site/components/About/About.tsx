import { type Component } from 'solid-js';
import Content from '../../../../README.md';
import { Page } from '../Page/Page.js';
import styles from './About.module.css';

export const About: Component = () => {
  return (
    <Page>
      <section class={styles.container}>
        <Content />
      </section>
    </Page>
  );
};

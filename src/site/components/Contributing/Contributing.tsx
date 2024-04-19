import { type Component } from 'solid-js';
import Content from '../../../../CONTRIBUTING.md';
import { Page } from '../Page/Page.js';
import styles from './Contributing.module.css';

export const Contributing: Component = () => {
  return (
    <Page>
      <section class={styles.container}>
        <Content class={styles.container} />
      </section>
    </Page>
  );
};

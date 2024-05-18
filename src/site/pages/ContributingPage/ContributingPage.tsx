import { type Component } from 'solid-js';
import Content from '../../../../CONTRIBUTING.md';
import { Page } from '../../components/Page/Page.js';
import styles from './ContributingPage.module.css';

export const ContributingPage: Component = () => {
  return (
    <Page>
      <section class={styles.container}>
        <Content class={styles.container} />
      </section>
    </Page>
  );
};

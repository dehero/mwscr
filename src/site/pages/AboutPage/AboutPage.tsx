import { type Component } from 'solid-js';
import Content from '../../../../README.md';
import { Page } from '../../components/Page/Page.jsx';
import styles from './AboutPage.module.css';

export const AboutPage: Component = () => {
  return (
    <Page>
      <section class={styles.container}>
        <Content />
      </section>
    </Page>
  );
};

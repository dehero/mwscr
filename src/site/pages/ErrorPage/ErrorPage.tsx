import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.js';
import { Frame } from '../../components/Frame/Frame.jsx';
import YellowExclamationMark from '../../images/exclamation.svg';
import styles from './ErrorPage.module.css';

export const ErrorPage: SiteRoutePage<SiteRouteParams, unknown> = () => {
  const msg = "This page doesn't exist.";

  return (
    <Frame variant="thin" class={styles.container}>
      <section class={styles.info}>
        <img src={YellowExclamationMark} class={styles.image} alt="yellow exclamation mark" />
        <p class={styles.message}>{msg}</p>
      </section>
    </Frame>
  );
};

export default ErrorPage;

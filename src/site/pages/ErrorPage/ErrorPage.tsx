import type { SiteRoutePage, SiteRouteParams } from '../../../core/entities/site-route.ts';
import { AppPage } from '../../components/App/App.tsx';
import { Frame } from '../../components/Frame/Frame.tsx';
import YellowExclamationMark from '../../images/exclamation.svg';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import styles from './ErrorPage.module.css';

export const ErrorPage: SiteRoutePage<SiteRouteParams, unknown> = () => {
  return (
    <>
      <AppPage title={localize(texts.app.error)} loading={false} />

      <Frame variant="thin" class={styles.container}>
        <section class={styles.info}>
          <img src={YellowExclamationMark} class={styles.image} alt="yellow exclamation mark" />
          <p class={styles.message}>{localize(texts.app.missing)}</p>
        </section>
      </Frame>
    </>
  );
};

export default ErrorPage;

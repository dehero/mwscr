import './Page.css';
import { type Component, type JSX } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { Frame } from '../Frame/Frame.js';
import { Navigation } from '../Navigation/Navigation.js';
import { Toaster } from '../Toaster/Toaster.js';
import styles from './Page.module.css';
import { YandexMetrikaCounter } from './YandexMetrikaCounter.js';

export interface PageProps {
  children?: JSX.Element;
}

export const Page: Component<PageProps> = (props) => {
  const pageContext = usePageContext();
  const info = () => useRouteInfo(pageContext);

  return (
    <>
      <YandexMetrikaCounter />
      <Toaster>
        <Frame variant="thick" component="header" class={styles.header}>
          <h1 class={styles.title}>{info()?.title || 'Morrowind Screenshots'}</h1>
        </Frame>

        <Navigation />

        {props.children}
      </Toaster>
    </>
  );
};

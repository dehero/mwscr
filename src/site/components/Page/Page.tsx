import './Page.css';
import { DocumentEventListener } from '@solid-primitives/event-listener';
import { debounce } from '@solid-primitives/scheduled';
import { type Component, createSignal, type JSX, Show } from 'solid-js';
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
  const meta = () => useRouteInfo(pageContext).meta();
  const [showLoadingToast, setShowLoadingToast] = createSignal(true);

  const handleTransitionStart = debounce(() => setShowLoadingToast(true), 100);

  const handleTransitionEnd = () => {
    handleTransitionStart.clear();
    setShowLoadingToast(false);
  };

  return (
    <>
      <Show when={import.meta.env.MODE === 'production'}>
        <YandexMetrikaCounter />
      </Show>

      <Toaster
        initialToasts={[
          [
            'page-loader',
            {
              message: 'Loading Page',
              loading: true,
              show: showLoadingToast(),
            },
          ],
        ]}
      >
        <Frame variant="thick" component="header" class={styles.header}>
          <h1 class={styles.title}>{meta().title || 'Morrowind Screenshots'}</h1>
        </Frame>

        <Navigation />

        {props.children}

        <DocumentEventListener
          // @ts-expect-error TODO: resolve custom event typings
          onPagetransitionstart={handleTransitionStart}
          onPagetransitionend={handleTransitionEnd}
          onHydrationend={handleTransitionEnd}
        />
      </Toaster>
    </>
  );
};

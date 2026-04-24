import { DocumentEventListener } from '@solid-primitives/event-listener';
import { debounce } from '@solid-primitives/scheduled';
import {
  Accessor,
  type Component,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  ParentComponent,
  Show,
  useContext,
} from 'solid-js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { DataPatchManager } from '../DataPatchManager/DataPatchManager.jsx';
import { DetachedDialogsProvider } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Navigation } from '../Navigation/Navigation.js';
import { Toaster } from '../Toaster/Toaster.jsx';
import styles from './App.module.css';
import { YandexMetrikaCounter } from './YandexMetrikaCounter.jsx';
import { createAsync, useCurrentMatches, useIsRouting, useLocation, useMatch, useParams } from '@solidjs/router';
import { SiteRoute, SiteRouteMeta, SiteRouteParams } from '../../../core/entities/site-route.js';
import { Title, MetaProvider } from '@solidjs/meta';
import { dataManager } from '../../data-managers/manager.js';

export interface AppContext {
  pageTitle: Accessor<string>;
  setPageTitle: (value: string) => void;
}

export const AppContext = createContext<AppContext>({
  pageTitle: () => '',
  setPageTitle: () => {},
});

export interface PageTitleProps {
  children: string;
}

export const PageTitle: Component<PageTitleProps> = (props) => {
  const { setPageTitle } = useContext(AppContext);

  createEffect(() => {
    setPageTitle(props.children);
  });

  return null;
};

const Page: ParentComponent = (props) => {
  const { pageTitle } = useContext(AppContext);
  const metaTitle = createMemo(() => [pageTitle(), 'Morrowind Screenshots'].filter(Boolean).join(' — '));

  return (
    <>
      <Title>{metaTitle()}</Title>

      <Frame variant="thick" component="header" class={styles.header}>
        <h1 class={styles.title}>{pageTitle() || 'Morrowind Screenshots'}</h1>
      </Frame>

      <Navigation />

      {props.children}
    </>
  );
};

export const App: ParentComponent = (props) => {
  const [pageTitle, setPageTitle] = createSignal<string>();

  // const breadcrumbs = createMemo(() =>
  //   matches().map((m) => {
  //     const callback = m.route.info as (params: SiteRouteParams) => SiteRouteMeta;
  //     const meta = callback(m.params);

  //     return meta;
  //   }),
  // );

  const showLoadingToast = useIsRouting();

  return (
    <AppContext.Provider value={{ pageTitle, setPageTitle }}>
      <MetaProvider>
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
          <DataPatchManager>
            <DetachedDialogsProvider>
              <Page>{props.children}</Page>
            </DetachedDialogsProvider>
          </DataPatchManager>
        </Toaster>
      </MetaProvider>
    </AppContext.Provider>
  );
};

import { debounce } from '@solid-primitives/scheduled';
import { Meta, MetaProvider, Title } from '@solidjs/meta';
import { useIsRouting, useLocation } from '@solidjs/router';
import type { Accessor, Component, ParentComponent } from 'solid-js';
import { createContext, createEffect, createMemo, createSignal, Show, useContext } from 'solid-js';
import { texts } from '../../texts/index.js';
import { currentLocale, getCurrentSiteOrigin, localize } from '../../utils/intl-utils.js';
import { DataPatchManager } from '../DataPatchManager/DataPatchManager.jsx';
import { DetachedDialogsProvider } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Navigation } from '../Navigation/Navigation.js';
import { Toaster } from '../Toaster/Toaster.jsx';
import styles from './App.module.css';
import { YandexMetrikaCounter } from './YandexMetrikaCounter.jsx';

export interface AppContext {
  pageTitle: Accessor<string | undefined>;
  setPageTitle: (value: string | undefined) => void;
  pageDescription: Accessor<string | undefined>;
  setPageDescription: (value: string | undefined) => void;
  pageLoading: Accessor<boolean>;
  setPageLoading: (value: boolean) => void;
}

export const AppContext = createContext<AppContext>({
  pageTitle: () => '',
  setPageTitle: () => {},
  pageDescription: () => '',
  setPageDescription: () => {},
  pageLoading: () => true,
  setPageLoading: () => {},
});

export interface AppPageProps {
  title: string;
  description?: string;
  loading: boolean;
}

export const AppPage: Component<AppPageProps> = (props) => {
  const { setPageTitle, setPageDescription, setPageLoading } = useContext(AppContext);

  createEffect(() => {
    setPageTitle(props.title);
  });

  createEffect(() => {
    setPageDescription(props.description);
  });

  createEffect(() => {
    setPageLoading(props.loading);
  });

  return null;
};

export const App: ParentComponent = (props) => {
  const [pageTitle, setPageTitle] = createSignal<string>();
  const [pageDescription, setPageDescription] = createSignal<string>();
  const [pageLoading, setPageLoading] = createSignal<boolean>(true);

  const isRouting = useIsRouting();
  const location = useLocation();

  const isLoading = createMemo(() => isRouting() || pageLoading());

  const metaTitle = createMemo(() => [pageTitle(), localize(texts.app.title)].filter(Boolean).join(' — '));
  const metaDescription = createMemo(() => pageDescription() || localize(texts.app.description));
  const metaUrl = createMemo(() => `${getCurrentSiteOrigin()}${location.pathname}${location.search}${location.hash}`);

  createEffect(() => {
    document.documentElement.lang = currentLocale();
  });

  const [showLoadingToast, setShowLoadingToast] = createSignal(true);

  const startLoadingToast = debounce(() => setShowLoadingToast(true), 100);

  createEffect(() => {
    if (isLoading()) {
      startLoadingToast();
    } else {
      startLoadingToast.clear();
      setShowLoadingToast(false);
    }
  });

  return (
    <AppContext.Provider
      value={{
        pageTitle,
        setPageTitle,
        pageDescription,
        setPageDescription,
        pageLoading,
        setPageLoading,
      }}
    >
      <MetaProvider>
        <Show when={import.meta.env.MODE === 'production'}>
          <YandexMetrikaCounter />
        </Show>

        <Toaster
          initialToasts={[
            [
              'page-loader',
              {
                message: localize(texts.app.loadingPage),
                loading: true,
                show: showLoadingToast(),
              },
            ],
          ]}
        >
          <DataPatchManager>
            <DetachedDialogsProvider>
              <Title>{metaTitle()}</Title>
              <Meta name="description" content={metaDescription()} />
              <Meta property="og:title" content={metaTitle()} />
              <Meta property="og:description" content={metaDescription()} />
              <Meta property="og:site_name" content={localize(texts.app.title)} />
              <Meta property="og:url" content={metaUrl()} />
              <Meta property="og:image" content={`${getCurrentSiteOrigin()}/apple-touch-icon.png`} />

              <Frame variant="thick" component="header" class={styles.header}>
                <h1 class={styles.title}>{pageTitle() || localize(texts.app.title)}</h1>
              </Frame>

              <Navigation />

              {props.children}
            </DetachedDialogsProvider>
          </DataPatchManager>
        </Toaster>
      </MetaProvider>
    </AppContext.Provider>
  );
};

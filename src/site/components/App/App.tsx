import { DocumentEventListener } from '@solid-primitives/event-listener';
import { debounce } from '@solid-primitives/scheduled';
import { MetaProvider, Title } from '@solidjs/meta';
import {
  createAsync,
  useBeforeLeave,
  useCurrentMatches,
  useIsRouting,
  useLocation,
  useMatch,
  useParams,
} from '@solidjs/router';
import type { Accessor, Component, ParentComponent } from 'solid-js';
import { createContext, createEffect, createMemo, createSignal, onMount, Show, useContext } from 'solid-js';
import { SiteRoute, SiteRouteMeta, SiteRouteParams } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';
import { DataPatchManager } from '../DataPatchManager/DataPatchManager.jsx';
import { DetachedDialogsProvider } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Navigation } from '../Navigation/Navigation.js';
import { Toast, Toaster } from '../Toaster/Toaster.jsx';
import styles from './App.module.css';
import { YandexMetrikaCounter } from './YandexMetrikaCounter.jsx';

export interface AppContext {
  pageTitle: Accessor<string | undefined>;
  setPageTitle: (value: string | undefined) => void;
}

export const AppContext = createContext<AppContext>({
  pageTitle: () => '',
  setPageTitle: () => {},
});

export interface AppPageProps {
  title: string;
  loading: boolean;
}

export const AppPage: Component<AppPageProps> = (props) => {
  const { setPageTitle } = useContext(AppContext);

  createEffect(() => {
    setPageTitle(props.title);
  });

  // onMount(() => {
  //   document.dispatchEvent(new Event('pagetransitionend'));
  // });

  createEffect(() => {
    if (!props.loading) {
      document.dispatchEvent(new Event('pagetransitionend'));
    }
  });

  return null;
};

export const App: ParentComponent = (props) => {
  const [pageTitle, setPageTitle] = createSignal<string>();

  const metaTitle = createMemo(() => [pageTitle(), 'Morrowind Screenshots'].filter(Boolean).join(' — '));

  // const breadcrumbs = createMemo(() =>
  //   matches().map((m) => {
  //     const callback = m.route.info as (params: SiteRouteParams) => SiteRouteMeta;
  //     const meta = callback(m.params);

  //     return meta;
  //   }),
  // );

  // const showLoadingToast = useIsRouting();

  const [showLoadingToast, setShowLoadingToast] = createSignal(true);

  const handleTransitionStart = debounce(() => setShowLoadingToast(true), 100);

  const handleTransitionEnd = () => {
    handleTransitionStart.clear();
    setShowLoadingToast(false);
  };

  useBeforeLeave(() => {
    document.dispatchEvent(new Event('pagetransitionstart'));
  });

  // // onMount(() => {
  // //   setShowLoadingToast(false);
  // // });

  /* <>
      <meta
        name="description"
        content={
          meta().description ||
          'Original screenshots and videos from The Elder Scrolls III: Morrowind. No graphic and unlore mods. No color filters. No interface.'
        }
      />
      <meta property="og:title" content={meta().title || site.name} />
      <Show when={meta().description}>
        <meta property="og:description" content={meta().description} />
      </Show>
      <For each={asArray(meta().imageUrl ?? icon)}>
        {(url) => <meta property="og:image" content={`${site.origin}${getResourcePreviewUrl(url)}`} />}
      </For>
      <meta property="og:url" content={`${site.origin}${pageContext.urlPathname}`} />  */

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
              <Title>{metaTitle()}</Title>

              <Frame variant="thick" component="header" class={styles.header}>
                <h1 class={styles.title}>{pageTitle() || 'Morrowind Screenshots'}</h1>
              </Frame>

              <Navigation />

              {props.children}
            </DetachedDialogsProvider>
          </DataPatchManager>
        </Toaster>
      </MetaProvider>

      <DocumentEventListener onPagetransitionstart={handleTransitionStart} onPagetransitionend={handleTransitionEnd} />
    </AppContext.Provider>
  );
};

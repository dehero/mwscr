import { useLocation } from '@solidjs/router';
import { type Component, For, type JSX } from 'solid-js';
import { Button } from '../Button/Button.js';
import { routes } from '../routes.js';
import styles from './App.module.css';

export interface AppProps {
  children?: JSX.Element;
}

export const App: Component<AppProps> = (props) => {
  const location = useLocation();

  return (
    <>
      <header class={styles.header}>
        <span class={styles.title}>
          <img src="/icon.png" width={16} height={16} /> Morrowind Screenshots
        </span>

        <nav class={styles.nav}>
          <For each={routes}>
            {(route) => (
              <Button href={route.path} active={location.pathname === route.path}>
                {route.info?.label ?? route.path}
              </Button>
            )}
          </For>
        </nav>

        <Button
          // TODO: use github-issue-resolvers
          href="https://github.com/dehero/mwscr/issues/new?labels=proposal&template=proposal.yml"
          target="_blank"
        >
          Propose
        </Button>
      </header>

      <main class={styles.main}>{props.children}</main>
    </>
  );
};

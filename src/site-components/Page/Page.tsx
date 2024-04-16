import { useLocation } from '@solidjs/router';
import { type Component, For, type JSX, Show } from 'solid-js';
import { Button } from '../Button/Button.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { routes } from '../routes.js';
import styles from './Page.module.css';

export interface PageProps {
  children?: JSX.Element;
  status?: string;
}

export const Page: Component<PageProps> = (props) => {
  const location = useLocation();

  return (
    <>
      <Frame variant="thick" component="header" class={styles.header}>
        <div class={styles.title}>
          <img src="/icon.png" width={16} height={16} class={styles.icon} />
          Morrowind Screenshots
        </div>
      </Frame>

      <nav class={styles.nav}>
        <For each={routes}>
          {(route) => (
            <Button href={route.path} active={location.pathname === route.path}>
              {route.info?.label ?? route.path}
            </Button>
          )}
        </For>

        <Button
          // TODO: use github-issue-resolvers
          href="https://github.com/dehero/mwscr/issues/new?labels=proposal&template=proposal.yml"
          target="_blank"
        >
          Propose
        </Button>
      </nav>

      <main class={styles.main}>{props.children}</main>

      <Show when={props.status}>
        <Frame variant="thin" class={styles.status}>
          {props.status}
        </Frame>
      </Show>
    </>
  );
};

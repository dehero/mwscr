import { type Component, type JSX, Show } from 'solid-js';
import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/proposal.js';
import { contributingRoute } from '../../routes/contributing-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { inboxRoute } from '../../routes/inbox-route.js';
import { publishedRoute } from '../../routes/published-route.js';
import { trashRoute } from '../../routes/trash-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.js';
import { Frame } from '../Frame/Frame.js';
import { RouteButton } from '../RouteButton/RouteButton.js';
import styles from './Page.module.css';

export interface PageProps {
  children?: JSX.Element;
  status?: string;
  title?: string;
}

export const Page: Component<PageProps> = (props) => {
  return (
    <>
      <Frame variant="thick" component="header" class={styles.header}>
        <div class={styles.title}>
          <img src="/icon.png" width={16} height={16} class={styles.icon} />
          {props.title || 'Morrowind Screenshots'}
        </div>
      </Frame>

      <nav class={styles.nav}>
        <RouteButton route={homeRoute} />
        <RouteButton route={publishedRoute} />
        <RouteButton route={usersRoute} />
        <div class={styles.spacer} />
        <RouteButton route={inboxRoute} />
        <RouteButton route={trashRoute} />
        <RouteButton route={contributingRoute} />
        <Button href={createProposalIssueUrl()} target="_blank">
          +
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

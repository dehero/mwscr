import './Page.css';
import type { Component, JSX } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/proposal.js';
import { contributingRoute } from '../../routes/contributing-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.js';
import { Frame } from '../Frame/Frame.js';
import { RouteButton } from '../RouteButton/RouteButton.js';
import { Toaster } from '../Toaster/Toaster.js';
import styles from './Page.module.css';

export interface PageProps {
  children?: JSX.Element;
}

export const Page: Component<PageProps> = (props) => {
  const info = usePageContext().routeInfo;

  return (
    <Toaster>
      <Frame variant="thick" component="header" class={styles.header}>
        <div class={styles.title}>
          {/* <img src="/icon.png" width={16} height={16} class={styles.icon} /> */}
          {info?.title || 'Morrowind Screenshots'}
        </div>
      </Frame>

      <nav class={styles.nav}>
        <RouteButton route={homeRoute} />
        <RouteButton route={postsRoute} params={{ managerName: 'published' }} />
        <RouteButton route={usersRoute} />
        <div class={styles.spacer} />
        <RouteButton route={postsRoute} params={{ managerName: 'inbox' }} />
        <RouteButton route={postsRoute} params={{ managerName: 'trash' }} />
        <RouteButton route={contributingRoute} />
        <Button href={createProposalIssueUrl()} target="_blank">
          +
        </Button>
      </nav>

      <main class={styles.main}>{props.children}</main>
    </Toaster>
  );
};

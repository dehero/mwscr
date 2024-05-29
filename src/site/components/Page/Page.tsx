import './Page.css';
import { type Component, type JSX } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import pkg from '../../../../package.json';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Frame } from '../Frame/Frame.js';
import { RouteButton } from '../RouteButton/RouteButton.js';
import { Spacer } from '../Spacer/Spacer.js';
import { Toaster } from '../Toaster/Toaster.js';
import styles from './Page.module.css';

export interface PageProps {
  children?: JSX.Element;
}

export const Page: Component<PageProps> = (props) => {
  const info = usePageContext().routeInfo;
  const buildDate = usePageContext().buildDate;

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
        <RouteButton route={postsRoute} params={{ managerName: 'published' }} title="Posts" />
        <RouteButton route={usersRoute} />
        <RouteButton route={helpRoute} params={{ topicId: '' }} />

        <Spacer />

        <div class={styles.version}>
          v{typeof pkg === 'object' && 'version' in pkg && typeof pkg.version === 'string' ? pkg.version : undefined}{' '}
          {buildDate}
        </div>
      </nav>

      <main class={styles.main}>{props.children}</main>
    </Toaster>
  );
};

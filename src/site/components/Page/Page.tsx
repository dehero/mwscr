import './Page.css';
import clsx from 'clsx';
import { type Component, type JSX } from 'solid-js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postRoute } from '../../routes/post-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { userRoute } from '../../routes/user-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Frame } from '../Frame/Frame.js';
import { RouteButton } from '../RouteButton/RouteButton.js';
import { Toaster } from '../Toaster/Toaster.js';
import styles from './Page.module.css';
import { YandexMetrikaCounter } from './YandexMetrikaCounter.js';

export interface PageProps {
  children?: JSX.Element;
}

export const Page: Component<PageProps> = (props) => {
  const info = useRouteInfo();

  return (
    <>
      <YandexMetrikaCounter />
      <Toaster>
        <Frame variant="thick" component="header" class={styles.header}>
          <h1 class={styles.title}>{info?.title || 'Morrowind Screenshots'}</h1>
        </Frame>

        <nav class={styles.nav}>
          <RouteButton route={homeRoute} />

          <RouteButton
            route={postsRoute}
            activeRoutes={[postRoute, postsRoute]}
            params={{ managerName: 'published' }}
            matchParams
          />

          <RouteButton route={usersRoute} activeRoutes={[userRoute, usersRoute]} />

          <RouteButton route={helpRoute} params={{ topicId: '' }} />

          <RouteButton
            route={postsRoute}
            activeRoutes={[postRoute, postsRoute]}
            params={{ managerName: 'inbox' }}
            matchParams
            class={clsx(styles.pullRight, styles.navItem)}
          />

          <RouteButton
            route={postsRoute}
            activeRoutes={[postRoute, postsRoute]}
            params={{ managerName: 'trash' }}
            matchParams
          />
        </nav>

        {props.children}
      </Toaster>
    </>
  );
};

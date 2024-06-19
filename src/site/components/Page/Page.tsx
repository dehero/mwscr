import './Page.css';
import { type Component, type JSX } from 'solid-js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postRoute } from '../../routes/post-route.js';
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
  const info = useRouteInfo();

  return (
    <Toaster>
      <Frame variant="thick" component="header" class={styles.header}>
        <h1 class={styles.title}>
          {/* <img src="/icon.png" width={16} height={16} class={styles.icon} /> */}
          {info.title || 'Morrowind Screenshots'}
        </h1>
      </Frame>

      <nav class={styles.nav}>
        <RouteButton route={homeRoute} />
        {/* <RouteButton
          route={postsRoute}
          activeRoutes={[postRoute, postsRoute]}
          params={{ managerName: 'published' }}
          title="Posts"
        /> */}
        {/* <For each={Object.keys(postsRouteInfos)}>
          {(managerName) => (
            <RouteButton
              route={postsRoute}
              activeRoutes={[postRoute, postsRoute]}
              params={{ managerName }}
              matchParams
            />
          )}
        </For> */}
        <RouteButton
          route={postsRoute}
          activeRoutes={[postRoute, postsRoute]}
          params={{ managerName: 'published' }}
          matchParams
        />
        <RouteButton route={usersRoute} />
        <RouteButton route={helpRoute} params={{ topicId: '' }} />

        <Spacer />

        <RouteButton
          route={postsRoute}
          activeRoutes={[postRoute, postsRoute]}
          params={{ managerName: 'inbox' }}
          matchParams
        />

        <RouteButton
          route={postsRoute}
          activeRoutes={[postRoute, postsRoute]}
          params={{ managerName: 'trash' }}
          matchParams
        />
      </nav>

      <main class={styles.main}>{props.children}</main>
    </Toaster>
  );
};

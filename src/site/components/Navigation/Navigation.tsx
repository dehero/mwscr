import { type Component, For, Show } from 'solid-js';
import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import type { Option } from '../../../core/entities/option.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import type { RouteMatch } from '../../routes/index.js';
import { resolveFirstRoute } from '../../routes/index.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.js';
import { Select } from '../Select/Select.js';
import { Spacer } from '../Spacer/Spacer.js';
import styles from './Navigation.module.css';

const navigationItems = [
  { route: homeRoute, params: {} },
  { route: postsRoute, params: { managerName: 'published' } },
  { route: postsRoute, params: { managerName: 'inbox' } },
  { route: postsRoute, params: { managerName: 'trash' } },
  { route: usersRoute, params: {} },
  { route: helpRoute, params: { topicId: '' } },
] as RouteMatch[];

export function createOption({ route, params }: RouteMatch): Option {
  const info = route?.info(params as never);
  const url = route?.createUrl(params as never);

  return {
    label: info?.label || info?.title || 'unknown',
    value: url,
  };
}

export const Navigation: Component = () => {
  const location = usePageContext().urlParsed;
  const pageContent = usePageContext();
  const currentRouteInfo = () => useRouteInfo(pageContent);

  const options = () => navigationItems.map((item) => createOption(item));
  const selectedOption = () =>
    options().find((option) =>
      location.pathname === '/'
        ? option.value === location.pathname
        : option.value && option.value !== '/'
          ? location.pathname.startsWith(option.value)
          : undefined,
    );

  const breadcrumbs = () => {
    const parts = ['', ...location.pathname.split('/').filter(Boolean)];
    const options: Option[] = [];
    const locationInfo = currentRouteInfo();

    let url = '';

    parts.pop();

    for (const part of parts) {
      url += `${part}/`;

      const item = resolveFirstRoute(url);
      options.push(createOption(item));
    }

    options.push({ label: locationInfo?.label || locationInfo?.title || 'unknown', value: location.pathname });

    return options;
  };

  return (
    <nav class={styles.nav}>
      <For each={options()}>
        {(option) => (
          <Button href={option.value} active={option.value === selectedOption()?.value} class={styles.button}>
            {option.label}
          </Button>
        )}
      </For>

      <Select
        options={options()}
        // @ts-expect-error No proper typing for navigate
        onChange={(value) => navigate(value)}
        value={selectedOption()?.value}
        class={styles.menu}
      />

      <Show when={breadcrumbs().length > 1}>
        <Spacer />
        <span class={styles.breadcrumbs}>
          <For each={breadcrumbs()}>
            {(breadcrumb, index) => (
              <>
                {index() > 0 && ' / '}
                <Show when={index() < breadcrumbs().length - 1} fallback={breadcrumb.label}>
                  <a href={breadcrumb.value} class={styles.link}>
                    {breadcrumb.label}
                  </a>
                </Show>
              </>
            )}
          </For>
        </span>
      </Show>
    </nav>
  );
};

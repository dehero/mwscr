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
import { OverflowContainer } from '../OverflowContainer/OverflowContainer.jsx';
import { Select } from '../Select/Select.js';
import styles from './Navigation.module.css';

const navigationItems = [
  { route: homeRoute, params: {} },
  { route: postsRoute, params: { managerName: 'posts' } },
  { route: postsRoute, params: { managerName: 'inbox' } },
  { route: postsRoute, params: { managerName: 'trash' } },
  { route: usersRoute, params: {} },
  { route: helpRoute, params: { topicId: '' } },
] as RouteMatch[];

export function createOption({ route, params }: RouteMatch): Option {
  const info = route.meta(params as never);
  const url = route.createUrl(params as never);

  return {
    label: info.label || info.title || 'unknown',
    value: url,
  };
}

export const Navigation: Component = () => {
  const pageContext = usePageContext();
  const pathname = () => useRouteInfo(pageContext).pathname();
  const meta = () => useRouteInfo(pageContext).meta();

  const options = () => navigationItems.map((item) => createOption(item));
  const selectedOption = () =>
    options().find((option) =>
      pathname() === '/'
        ? option.value === pathname()
        : option.value && option.value !== '/'
          ? pathname().startsWith(option.value)
          : undefined,
    );

  const breadcrumbs = () => {
    const parts = ['', ...pathname().split('/').filter(Boolean)];
    const options: Option[] = [];
    const locationMeta = meta();

    let url = '';

    parts.pop();

    for (const part of parts) {
      url += `${part}/`;

      const item = resolveFirstRoute(url);
      options.push(createOption(item));
    }

    options.push({ label: locationMeta.label || locationMeta.title || 'unknown', value: pathname() });

    return options;
  };

  return (
    <nav class={styles.nav}>
      <OverflowContainer
        fallback={
          <Select
            options={options()}
            // @ts-expect-error No proper typing for navigate
            onChange={(value) => navigate(value)}
            value={selectedOption()?.value}
          />
        }
        containerClass={styles.menuWrapper}
        class={styles.menu}
      >
        <For each={options()}>
          {(option) => (
            <Button href={option.value} active={option.value === selectedOption()?.value}>
              {option.label}
            </Button>
          )}
        </For>
      </OverflowContainer>

      <Show when={breadcrumbs().length > 1}>
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

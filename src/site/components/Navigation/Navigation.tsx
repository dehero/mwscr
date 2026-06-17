import { useCurrentMatches, useLocation, useNavigate } from '@solidjs/router';
import { type Component, For, Show, useContext } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import type { SiteRoute } from '../../../core/entities/site-route.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import type { RouteMatch } from '../../routes/index.js';
import { usersRoute } from '../../routes/users-route.js';
import { AppContext } from '../App/App.js';
import { Button } from '../Button/Button.js';
import { DataPatchSelect } from '../DataPatchSelect/DataPatchSelect.jsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Select } from '../Select/Select.js';
import styles from './Navigation.module.css';

const navigationItems = [
  { route: homeRoute, params: {} },
  { route: postsRoute, params: { managerName: 'posts' } },
  { route: postsRoute, params: { managerName: 'extras' } },
  { route: postsRoute, params: { managerName: 'drafts' } },
  { route: postsRoute, params: { managerName: 'rejects' } },
  { route: usersRoute, params: {} },
  { route: helpRoute, params: { topicId: '' } },
] as RouteMatch[];

export function createOption({ route, params }: RouteMatch): Option {
  const info = route.info(params as never);
  const url = route.createUrl(params as never);

  return {
    label: info.label || 'unknown',
    value: url,
  };
}

function isSiteRoute(value: unknown): value is SiteRoute {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'path' in value &&
      'info' in value &&
      typeof value.info === 'function' &&
      'createUrl' in value &&
      typeof value.createUrl === 'function',
  );
}

function createRouteChain(match: RouteMatch): RouteMatch[] {
  const chain: RouteMatch[] = [match];

  let current: RouteMatch | undefined = match;

  while (current?.route.parent) {
    const parent = current.route.parent(current.params as never);
    if (!parent) {
      break;
    }

    chain.unshift({
      route: parent.route,
      params: parent.params,
    });

    current = {
      route: parent.route,
      params: parent.params,
    };
  }

  return chain;
}

export const Navigation: Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentMatches = useCurrentMatches();
  const pathname = () => location.pathname;
  const { pageTitle } = useContext(AppContext);

  const [patchSize] = useLocalPatch();

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
    const leaf = currentMatches().at(-1);

    if (!leaf || !isSiteRoute(leaf.route.key)) {
      return [];
    }

    const items = createRouteChain({
      route: leaf.route.key,
      params: leaf.params,
    });

    const seen = new Set<string>();
    const result: Option[] = [];

    for (const item of items) {
      const option = createOption(item);
      if (typeof option.value !== 'string' || seen.has(option.value)) {
        continue;
      }

      seen.add(option.value);
      result.push(option);
    }

    const lastOption = result.at(-1);
    const currentPageTitle = pageTitle();

    if (lastOption && currentPageTitle) {
      lastOption.label = currentPageTitle;
    }

    return result;
  };

  return (
    <nav class={styles.container}>
      <div class={styles.shortcuts}>
        <DataPatchSelect class={styles.patch} />

        <Button href={createDetachedDialogFragment('contributing', patchSize() > 0 ? 'patch' : 'variants')}>
          <Show fallback="Contribute" when={patchSize() > 0}>
            Contribute ({patchSize()})
          </Show>
        </Button>
      </div>
      <For each={options()}>
        {(option) => (
          <Button href={option.value} active={option.value === selectedOption()?.value} class={styles.button}>
            {option.label}
          </Button>
        )}
      </For>
      <Select
        options={options()}
        onChange={(value) => navigate(value ?? '#')}
        value={selectedOption()?.value}
        class={styles.menu}
      />{' '}
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

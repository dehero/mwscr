import { type Component, For } from 'solid-js';
import { navigate } from 'vike/client/router';
import { usePageContext } from 'vike-solid/usePageContext';
import { helpRoute } from '../../routes/help-route.js';
import { homeRoute } from '../../routes/home-route.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.js';
import type { SelectOption } from '../Select/Select.js';
import { Select } from '../Select/Select.js';
import styles from './Navigation.module.css';

const navigationItems = [
  { route: homeRoute, params: {} },
  { route: postsRoute, params: { managerName: 'published' } },
  { route: usersRoute, params: {} },
  { route: helpRoute, params: { topicId: '' } },
  { route: postsRoute, params: { managerName: 'inbox' } },
  { route: postsRoute, params: { managerName: 'trash' } },
];

type NavigationItem = (typeof navigationItems)[number];

export function createOption({ route, params }: NavigationItem): SelectOption<string> {
  const info = route.info(params as never, undefined as never);
  const url = route.createUrl(params as never);

  return {
    label: info.label || info.title,
    value: url,
  };
}

export const Navigation: Component = () => {
  const location = usePageContext().urlParsed;

  const options = () => navigationItems.map(createOption);
  const selectedOption = () =>
    options().find((option) =>
      location.pathname === '/'
        ? option.value === location.pathname
        : option.value && option.value !== '/'
          ? location.pathname.startsWith(option.value)
          : undefined,
    );

  const returnUrl = () => {
    const parts = location.pathname.split('/').filter(Boolean);

    return `/${parts.slice(0, -1).map((part) => `${part}/`)}`;
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

      <Button href={returnUrl()} class={styles.returnButton}>
        Return
      </Button>
    </nav>
  );
};

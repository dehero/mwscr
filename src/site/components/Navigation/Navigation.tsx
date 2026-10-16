import { useCurrentMatches, useLocation, useNavigate } from '@solidjs/router';
import { type Component, createSignal, For, Show, useContext } from 'solid-js';
import type { Option } from '../../../core/entities/option.ts';
import type { SiteRouteReference } from '../../../core/entities/site-route.ts';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { helpRoute } from '../../routes/help-route.ts';
import { homeRoute } from '../../routes/home-route.ts';
import { imageEditorRoute } from '../../routes/image-editor-route.ts';
import type { RouteMatch } from '../../routes/index.ts';
import { locationsRoute } from '../../routes/locations-route.ts';
import { postsRoute } from '../../routes/posts-route.ts';
import { statsRoute } from '../../routes/stats-route.ts';
import { usersRoute } from '../../routes/users-route.ts';
import { texts } from '../../texts/index.ts';
import { getLocaleSwitchUrl, localize, switchLocale } from '../../utils/intl-utils.ts';
import { AppContext } from '../App/App.tsx';
import { Button } from '../Button/Button.tsx';
// import { DataPatchSelect } from '../DataPatchSelect/DataPatchSelect.tsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { MenuDialog } from '../MenuDialog/MenuDialog.tsx';
import { Select } from '../Select/Select.tsx';
import styles from './Navigation.module.css';

const primaryNavigationItems = [
  { route: homeRoute, params: {} },
  { route: postsRoute, params: { managerName: 'posts' } },
  { route: postsRoute, params: { managerName: 'extras' } },
  { route: usersRoute, params: {} },
  { route: helpRoute, params: { topicId: '' } },
] as RouteMatch[];

// Virtual "Workshop" section: project work pages grouped under a single menu,
// without a page of their own. Statistics is the entry point of the section.
const workshopNavigationItems = [
  { route: statsRoute, params: {} },
  { route: locationsRoute, params: {} },
  { route: postsRoute, params: { managerName: 'drafts' } },
  { route: postsRoute, params: { managerName: 'rejects' } },
  { route: imageEditorRoute, params: {} },
] as RouteMatch[];

export function createOption({ route, params }: RouteMatch): Option {
  const info = route.info(params as never);
  const url = route.createUrl(params as never);

  return {
    label: info.label || 'unknown',
    value: url,
  };
}

function isSiteRoute(value: unknown): value is SiteRouteReference {
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

  while (current.route.parent) {
    const parent = current.route.parent(current.params as never);
    if (!parent) {
      break;
    }

    chain.unshift({
      route: parent.route,
      params: parent.params,
    });

    current = {
      route: parent.route as RouteMatch['route'],
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
  const localeSwitchUrl = getLocaleSwitchUrl();

  const [patchSize] = useLocalPatch();

  const [showWorkshopDialog, setShowWorkshopDialog] = createSignal(false);

  const primaryOptions = () => primaryNavigationItems.map((item) => createOption(item));
  const workshopOptions = () =>
    workshopNavigationItems.map((item) => ({ ...createOption(item), group: texts.app.workshop }));
  const options = () => [...primaryOptions(), ...workshopOptions()];
  const selectedOption = () =>
    options().find((option) =>
      pathname() === '/'
        ? option.value === pathname()
        : option.value && option.value !== '/'
          ? pathname().startsWith(option.value)
          : undefined,
    );
  const selectedWorkshopOption = () => workshopOptions().find((option) => option.value === selectedOption()?.value);
  const workshopActive = () => Boolean(selectedWorkshopOption());

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
        {/* <DataPatchSelect class={styles.patch} /> */}

        <Button href={createDetachedDialogFragment('contributing', patchSize() > 0 ? 'patch' : 'variants')}>
          <Show fallback={localize(texts.contributing.contribute)} when={patchSize() > 0}>
            {localize(texts.contributing.contribute)} ({patchSize()})
          </Show>
        </Button>
        <Button href={localeSwitchUrl} onClick={localeSwitchUrl ? undefined : switchLocale}>
          {localize(texts.common.language, true)}
        </Button>
      </div>
      <For each={primaryOptions()}>
        {(option) => (
          <Button href={option.value} active={option.value === selectedOption()?.value} class={styles.button}>
            {localize(option.label)}
          </Button>
        )}
      </For>
      <Button
        active={workshopActive()}
        class={styles.workshop}
        onClick={(e: Event) => {
          e.preventDefault();
          setShowWorkshopDialog(true);
        }}
      >
        {localize(texts.app.workshop)}
      </Button>
      <MenuDialog
        title={localize(texts.app.workshop)}
        show={showWorkshopDialog()}
        value={selectedWorkshopOption()?.value}
        options={workshopOptions()}
        onSelect={(value) => {
          setShowWorkshopDialog(false);
          navigate(value);
        }}
        onClose={() => setShowWorkshopDialog(false)}
      />
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
                <Show when={index() < breadcrumbs().length - 1} fallback={localize(breadcrumb.label)}>
                  <a href={breadcrumb.value} class={styles.link}>
                    {localize(breadcrumb.label)}
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

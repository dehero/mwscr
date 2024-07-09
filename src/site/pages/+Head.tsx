import { For, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import icon from '../../../assets/icon.png?format=avif&imagetools';
import { SITE_URL } from '../../core/stores/site-store.js';
import { asArray } from '../../core/utils/common-utils.js';
import { getResourcePreviewUrl } from '../data-managers/resources.js';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function Head() {
  const pageContext = usePageContext();
  const routeInfo = useRouteInfo(pageContext);

  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta
        name="description"
        content={
          routeInfo?.description ||
          'Original screenshots and videos from The Elder Scrolls III: Morrowind. No third-party mods. No color filters. No interface.'
        }
      />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta property="og:title" content={routeInfo?.title || 'Morrowind Screenshots'} />
      <Show when={routeInfo?.description}>
        <meta property="og:description" content={routeInfo?.description} />
      </Show>
      <meta property="og:type" content="website" />
      <For each={asArray(routeInfo?.imageUrl ?? icon)}>
        {(url) => <meta property="og:image" content={`${SITE_URL}${getResourcePreviewUrl(url)}`} />}
      </For>
      <meta property="og:url" content={`${SITE_URL}${pageContext.urlPathname}`} />
    </>
  );
}

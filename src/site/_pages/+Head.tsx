import { For, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import icon from '../../../assets/icon.png?format=avif&imagetools';
import { site } from '../../core/services/site.js';
import { asArray } from '../../core/utils/common-utils.js';
import { getResourcePreviewUrl } from '../data-managers/resources.js';
import { useRouteInfo } from '../hooks/useRouteInfo.js';

export default function Head() {
  const pageContext = usePageContext();
  const { meta } = useRouteInfo(pageContext);

  return (
    <>
      <meta
        name="description"
        content={
          meta().description ||
          'Original screenshots and videos from The Elder Scrolls III: Morrowind. No graphic and unlore mods. No color filters. No interface.'
        }
      />
      <meta property="og:title" content={meta().title || site.name} />
      <Show when={meta().description}>
        <meta property="og:description" content={meta().description} />
      </Show>
      <For each={asArray(meta().imageUrl ?? icon)}>
        {(url) => <meta property="og:image" content={`${site.origin}${getResourcePreviewUrl(url)}`} />}
      </For>
      <meta property="og:url" content={`${site.origin}${pageContext.urlPathname}`} />
    </>
  );
}

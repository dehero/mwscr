import { For } from 'solid-js';
import { useData } from 'vike-solid/useData';
import { asArray } from '../../../core/utils/common-utils.js';
import type { PostsPageData } from '../../components/PostsPage/PostsPage.js';
import { getStorePreviewUrl } from '../../components/ResourcePreview/ResourcePreview.js';
import LayoutHead from '../+Head.js';

export function Head() {
  const { postInfos } = useData<PostsPageData>();
  const urls = () => asArray(postInfos.at(-1)?.content);

  return (
    <>
      <LayoutHead />
      <For each={urls()}>
        {(url) => (
          <link rel="preload" fetchpriority="high" as="image" href={getStorePreviewUrl(url)} type="image/avif" />
        )}
      </For>
    </>
  );
}

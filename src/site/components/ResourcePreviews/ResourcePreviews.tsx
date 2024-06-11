import clsx from 'clsx';
import { type Component, createSignal, For } from 'solid-js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.jsx';
import styles from './ResourcePreviews.module.css';

export interface ResourcePreviewsProps {
  urls: string[];
  showTooltip?: boolean;
  onLoad?: () => void;
  class?: string;
}

export const ResourcePreviews: Component<ResourcePreviewsProps> = (props) => {
  const [loadedCount, setLoadedCount] = createSignal<number>(0);

  const handleLoad = () => {
    setLoadedCount(loadedCount() + 1);

    if (props.onLoad && props.urls.length === loadedCount()) {
      props.onLoad();
    }
  };

  return (
    <div class={clsx(styles.container, props.class)}>
      <For each={props.urls}>
        {(url) => <ResourcePreview url={url} class={styles.item} showTooltip={props.showTooltip} onLoad={handleLoad} />}
      </For>
    </div>
  );
};

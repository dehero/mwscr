import clsx from 'clsx';
import { type Component, For } from 'solid-js';
import type { MediaAspectRatio } from '../../../core/entities/media.js';
import { Frame } from '../Frame/Frame.js';
import { ResourcePreview } from '../ResourcePreview/ResourcePreview.js';
import styles from './ResourceSelector.module.css';

export interface ResourceSelector {
  urls: string[];
  selected?: string;
  onSelect: (url: string) => void;
  aspectRatio?: MediaAspectRatio;
  class?: string;
}

export const ResourceSelector: Component<ResourceSelector> = (props) => {
  return (
    <Frame component="section" variant="thin" class={clsx(styles.container, props.class)}>
      <For each={props.urls}>
        {(url) => (
          <label class={styles.item}>
            <input
              type="radio"
              value={url}
              name="selectedContent"
              checked={props.selected === url}
              onChange={() => props.onSelect(url)}
              class={styles.radio}
            />
            <ResourcePreview url={url} aspectRatio={props.aspectRatio} class={styles.preview} />
          </label>
        )}
      </For>
    </Frame>
  );
};

import clsx from 'clsx';
import { type Component, Match, Switch } from 'solid-js';
import { parseResourceUrl } from '../../../core/entities/resource.js';
import { Frame } from '../Frame/Frame.jsx';
import frameStyles from '../Frame/Frame.module.css';
import styles from './ResourcePreview.module.css';

function getStorePreviewUrl(url: string | undefined) {
  return url?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif');
}

export interface ResourcePreviewProps {
  url: string;
  class?: string;
}

export const ResourcePreview: Component<ResourcePreviewProps> = (props) => {
  const parsedUrl = parseResourceUrl(props.url);

  return (
    <Switch
      fallback={
        <Frame variant="thin" class={clsx(styles.fallback, props.class)}>
          {props.url}
        </Frame>
      }
    >
      <Match when={parsedUrl.protocol === 'store:'}>
        <img src={getStorePreviewUrl(props.url)} class={clsx(frameStyles.thin, styles.preview, props.class)} />
      </Match>
    </Switch>
  );
};

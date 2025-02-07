import { type Component, For, Show } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import type { PostInfo } from '../../../core/entities/post-info.js';
import type { Action } from '../../../core/utils/common-types.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostPreviews.module.css';
import { Toolbar } from './Toolbar.jsx';

const VirtualPostPreviews = clientOnly(() => import('./VirtualPostPreviews.jsx'));

export interface PostPreviewsProps {
  label?: string;
  postInfos: PostInfo[];
  scrollTarget?: HTMLElement;
  selected?: string[];
  onSelectedChange?: (id: string, value: boolean) => void;
  actions?: Action[];
}

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  const lastPostInfos = () => props.postInfos.slice(0, 18);

  return (
    <VirtualPostPreviews
      fallback={
        <div class={styles.container}>
          <Show when={props.label || props.actions?.length}>
            <Toolbar label={props.label} actions={props.actions} />
          </Show>
          <div class={styles.items}>
            <For each={lastPostInfos()}>
              {(postInfo) => (
                <PostPreview
                  postInfo={postInfo}
                  class={styles.item}
                  maxHeightMultiplier={1}
                  toggleSelectedOnClick={Boolean(props.selected?.length)}
                  selected={props.selected?.includes(postInfo.id)}
                  onSelectedChange={(value) => props.onSelectedChange?.(postInfo.id, value)}
                />
              )}
            </For>
          </div>
        </div>
      }
      label={props.label}
      postInfos={props.postInfos}
      scrollTarget={props.scrollTarget}
      selected={props.selected}
      onSelectedChange={props.onSelectedChange}
      actions={props.actions}
    />
  );
};

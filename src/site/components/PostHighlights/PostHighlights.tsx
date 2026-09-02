import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { IntlText } from '../../../core/entities/intl.js';
import type { PostInfo, PostInfoSelection } from '../../../core/entities/post-info.js';
import { listItems } from '../../../core/utils/common-utils.js';
import { capitalize } from '../../../core/utils/string-utils.js';
import { texts } from '../../texts/index.js';
import { isRu, localize } from '../../utils/intl-utils.js';
import { Label } from '../Label/Label.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostHighlights.module.css';

export interface PostHighlightsItem {
  label: IntlText;
  primary?: boolean;
  selection?: PostInfoSelection;
}

interface PostHighlightsGroup {
  labels: Partial<Record<string, string[]>>;
  primary?: boolean;
  postInfo: PostInfo;
}

export interface PostPreviewsProps {
  items: PostHighlightsItem[];
  class?: string;
}

function createGroupLabel(labels: Partial<Record<string, string[]>>) {
  const label = Object.entries(labels)
    .map(([postfix, prefixes]) =>
      prefixes ? `${listItems(prefixes, { union: localize(texts.common.and) })} ${postfix}` : postfix,
    )
    .join(', ');

  return isRu() ? capitalize(label.toLocaleLowerCase()) : label;
}

function splitPostLabel(label: string): [string, string] {
  const parts = label.split(' ');
  const postfix = parts[parts.length - 1] ?? '';
  const prefix = parts.slice(0, -1).join(' ');

  return [prefix, postfix];
}

export const PostHighlights: Component<PostPreviewsProps> = (props) => {
  const groups = (): PostHighlightsGroup[] =>
    Object.values(
      props.items.reduce(
        (acc, item) => {
          const postInfo = item.selection?.items[0];

          if (!postInfo) {
            return acc;
          }

          const [prefix, postfix] = splitPostLabel(localize(item.label));
          const id = `${postInfo.managerName}-${postInfo.id}`;
          const existing = acc[id];

          return {
            ...acc,
            [id]: {
              postInfo,
              labels: {
                ...existing?.labels,
                [postfix]: [...(existing?.labels[postfix] ?? []), prefix],
              },
              primary: item.primary || acc[id]?.primary,
            },
          };
        },
        {} as Record<string, PostHighlightsGroup>,
      ),
    );

  return (
    <Show when={groups().length > 0}>
      <div class={clsx(styles.container, props.class)}>
        <For each={groups()}>
          {({ labels, postInfo, primary }) => (
            <Label label={createGroupLabel(labels)} vertical class={clsx(styles.item, primary && styles.primary)}>
              <PostPreview postInfo={postInfo} class={styles.preview} maxHeightMultiplier={1} />
            </Label>
          )}
        </For>
      </div>
    </Show>
  );
};

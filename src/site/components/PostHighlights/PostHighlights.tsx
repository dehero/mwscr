import clsx from 'clsx';
import { type Component, For, Show } from 'solid-js';
import type { PostInfo, PostInfoSelection } from '../../../core/entities/post-info.js';
import { listItems } from '../../../core/utils/common-utils.js';
import { Label } from '../Label/Label.js';
import { PostPreview } from '../PostPreview/PostPreview.js';
import styles from './PostHighlights.module.css';

export const POST_HIGHIGHT_CHARACTERISTICS = ['First', 'Last', 'Less', 'Top'] as const;
export const POST_HIGHIGHT_TYPES = ['Post', 'Proposal', 'Request'] as const;

export type PostHighlightCharacteristic = (typeof POST_HIGHIGHT_CHARACTERISTICS)[number];
export type PostHighlightType = (typeof POST_HIGHIGHT_TYPES)[number];

export interface PostHighlightsItem {
  label: `${`${PostHighlightCharacteristic | string}` | PostHighlightCharacteristic} ${PostHighlightType}`;
  primary?: boolean;
  selection?: PostInfoSelection;
}

interface PostHighlightsGroup {
  labels: Partial<Record<PostHighlightType, string[]>>;
  primary?: boolean;
  postInfo: PostInfo;
}

export interface PostPreviewsProps {
  items: PostHighlightsItem[];
  class?: string;
}

function createGroupLabel(labels: Partial<Record<PostHighlightType, string[]>>) {
  return Object.entries(labels)
    .map(([type, label]) => `${listItems(label, false, 'and')} ${type}`)
    .join(', ');
}

function splitPostLabel(label: string) {
  const parts = label.split(' ');
  const typeStr = parts[parts.length - 1] as PostHighlightType;

  if (POST_HIGHIGHT_TYPES.includes(typeStr)) {
    return { label: parts.slice(0, -1).join(' '), type: typeStr };
  }
  return { label, type: 'Post' as PostHighlightType };
}

export const PostHighlights: Component<PostPreviewsProps> = (props) => {
  const groups = (): PostHighlightsGroup[] =>
    Object.values(
      props.items.reduce(
        (acc, item) => {
          const { selection, primary } = item;
          const postInfo = selection?.items[0];

          if (!postInfo) {
            return acc;
          }

          const { label, type } = splitPostLabel(item.label);
          const id = `${postInfo.managerName}-${postInfo.id}`;
          const existing = acc[id];

          return {
            ...acc,
            [id]: {
              postInfo,
              labels: {
                ...existing?.labels,
                [type]: [...(existing?.labels[type] ?? []), label],
              },
              primary: primary || acc[id]?.primary,
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
              <PostPreview postInfo={postInfo} class={styles.preview} />
            </Label>
          )}
        </For>
      </div>
    </Show>
  );
};

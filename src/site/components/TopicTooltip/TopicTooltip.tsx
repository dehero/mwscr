import clsx from 'clsx';
import { type Component, createResource, Show, splitProps } from 'solid-js';
import { dataManager } from '../../data-managers/manager.js';
import type { TooltipProps } from '../Tooltip/Tooltip.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import { TopicMessage } from '../TopicMessage/TopicMessage.jsx';
import styles from './TopicTooltip.module.css';

interface TopicTooltipProps extends Omit<TooltipProps, 'children'> {
  topicId: string | undefined;
}

export const TopicTooltip: Component<TopicTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['topicId', 'class']);

  const [topicEntry] = createResource(local.topicId, (topicId) =>
    typeof topicId === 'string' ? dataManager.topics.getEntry(topicId) : undefined,
  );

  return (
    <Show when={topicEntry()}>
      {(entry) => (
        <Tooltip class={clsx(styles.tooltip, local.class)} {...rest}>
          <TopicMessage topicEntry={entry()} class={styles.content} disableLinks />
        </Tooltip>
      )}
    </Show>
  );
};

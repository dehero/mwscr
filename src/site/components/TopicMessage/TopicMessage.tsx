import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { postViolationDescriptors } from '../../../core/entities/post.js';
import type { TopicEntry } from '../../../core/entities/topic.js';
import { texts } from '../../texts/index.js';
import { localField, localize } from '../../utils/intl-utils.js';
import { Icon } from '../Icon/Icon.jsx';
import styles from './TopicMessage.module.css';

interface TopicMessageProps {
  topicEntry: TopicEntry;
  disableLinks?: boolean;
  class?: string;
}

export const TopicMessage: Component<TopicMessageProps> = (props) => {
  const possibleViolation = () =>
    Object.values(postViolationDescriptors).find(({ topicId }) => topicId === props.topicEntry[0]);
  const title = () => localField(props.topicEntry[1], 'title') || props.topicEntry[1]?.title;
  const html = () => localField(props.topicEntry[1], 'html') || props.topicEntry[1]?.html;

  return (
    <section class={props.class}>
      <Show when={title()}>{(title) => <h2 class={styles.title}>{title()}</h2>}</Show>
      <p class={clsx(styles.text, props.disableLinks && styles.disableLinks)} innerHTML={html()} />
      <Show when={possibleViolation()}>
        {(possibleViolation) => (
          <>
            <p class={styles.violationTitle}>{localize(texts.content.possibleViolation)}</p>
            <span>
              <Icon color="health" size="small" variant="flat" class={styles.icon}>
                {possibleViolation().letter}
              </Icon>
              {localize(possibleViolation().title)}
            </span>
          </>
        )}
      </Show>
    </section>
  );
};

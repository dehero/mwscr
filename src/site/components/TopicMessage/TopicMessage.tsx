import clsx from 'clsx';
import { type Component, Show } from 'solid-js';
import { postViolationDescriptors } from '../../../core/entities/post.js';
import type { TopicEntry } from '../../../core/entities/topic.js';
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

  return (
    <section class={props.class}>
      <Show when={props.topicEntry[1]?.title}>{(title) => <h2 class={styles.title}>{title()}</h2>}</Show>
      <p class={clsx(styles.text, props.disableLinks && styles.disableLinks)} innerHTML={props.topicEntry[1]?.html} />
      <Show when={possibleViolation()}>
        {(possibleViolation) => (
          <>
            <p class={styles.violationTitle}>Possible Violation</p>
            <span>
              <Icon color="health" size="small" variant="flat" class={styles.icon}>
                {possibleViolation().letter}
              </Icon>
              {possibleViolation().title}
            </span>
          </>
        )}
      </Show>
    </section>
  );
};

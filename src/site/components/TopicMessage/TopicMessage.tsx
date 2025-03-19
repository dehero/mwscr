import clsx from 'clsx';
import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { Topic } from '../../../core/entities/topic.js';
import styles from './TopicMessage.module.css';

interface TopicMessageProps {
  topic: Topic;
  class?: string;
}

export const TopicMessage: Component<TopicMessageProps> = (props) => {
  return (
    <section class={clsx(styles.message, props.class)}>
      <Show when={props.topic.title}>
        <h2 class={styles.title}>{props.topic.title}</h2>
      </Show>
      <p class={styles.text} innerHTML={props.topic.html} />
    </section>
  );
};

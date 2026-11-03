import clsx from 'clsx';
import { type Component, createEffect, Show } from 'solid-js';
import { postViolationDescriptors } from '../../../core/entities/post.ts';
import { type TopicEntry, topicLinkReplacer } from '../../../core/entities/topic.ts';
import { texts } from '../../texts/index.ts';
import { localField, localize } from '../../utils/intl-utils.ts';
import { Icon } from '../Icon/Icon.tsx';
import { Markdown } from '../Markdown/Markdown.tsx';
import styles from './TopicMessage.module.css';

interface TopicMessageProps {
  topicEntry: TopicEntry;
  disableLinks?: boolean;
  class?: string;
}

export const TopicMessage: Component<TopicMessageProps> = (props) => {
  let textRef: HTMLDivElement | undefined;

  const possibleViolation = () =>
    Object.values(postViolationDescriptors).find(({ topicId }) => topicId === props.topicEntry[0]);
  const title = () => localField(props.topicEntry[1], 'title') || props.topicEntry[1]?.title;
  const body = () => localField(props.topicEntry[1], 'body') || props.topicEntry[1]?.body || '';

  createEffect(() => {
    body();

    for (const br of textRef?.querySelectorAll('pre + br') ?? []) {
      br.remove();
    }
  });

  return (
    <section class={props.class}>
      <Show when={title()}>{(title) => <h2 class={styles.title}>{title()}</h2>}</Show>
      <div ref={(el) => (textRef = el)} class={clsx(styles.text, props.disableLinks && styles.disableLinks)}>
        <Markdown linkReplacer={topicLinkReplacer}>{body()}</Markdown>
      </div>
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

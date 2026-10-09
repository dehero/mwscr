import { writeClipboard } from '@solid-primitives/clipboard';
import clsx from 'clsx';
import { type Component, createEffect, onCleanup, Show } from 'solid-js';
import { postViolationDescriptors } from '../../../core/entities/post.ts';
import type { TopicEntry } from '../../../core/entities/topic.ts';
import { texts } from '../../texts/index.ts';
import { localField, localize } from '../../utils/intl-utils.ts';
import { Icon } from '../Icon/Icon.tsx';
import { useToaster } from '../Toaster/Toaster.tsx';
import styles from './TopicMessage.module.css';

interface TopicMessageProps {
  topicEntry: TopicEntry;
  disableLinks?: boolean;
  class?: string;
}

export const TopicMessage: Component<TopicMessageProps> = (props) => {
  const { addToast } = useToaster();

  let textRef: HTMLDivElement | undefined;

  const possibleViolation = () =>
    Object.values(postViolationDescriptors).find(({ topicId }) => topicId === props.topicEntry[0]);
  const title = () => localField(props.topicEntry[1], 'title') || props.topicEntry[1]?.title;
  const html = () => localField(props.topicEntry[1], 'html') || props.topicEntry[1]?.html;

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const code = target?.closest('pre, code');

    if (!code) {
      return;
    }

    writeClipboard(code.textContent ?? '');
    addToast(localize(texts.content.codeCopied));
  };

  createEffect(() => {
    const container = textRef;
    const currentHtml = html();

    if (!container) {
      return;
    }

    container.innerHTML = currentHtml ?? '';

    for (const br of container.querySelectorAll('pre + br')) {
      br.remove();
    }
  });

  onCleanup(() => {
    textRef?.removeEventListener('click', handleClick);
  });

  return (
    <section class={props.class}>
      <Show when={title()}>{(title) => <h2 class={styles.title}>{title()}</h2>}</Show>
      <div
        ref={(el) => {
          textRef = el;
          el.addEventListener('click', handleClick);
        }}
        class={clsx(styles.text, props.disableLinks && styles.disableLinks)}
      />
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

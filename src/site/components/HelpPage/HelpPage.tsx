import { type Component, createEffect, createSignal, For, Show } from 'solid-js';
import { useData } from 'vike-solid/useData';
import type { Topic, TopicEntry } from '../../../core/entities/topic.js';
import { useParams } from '../../hooks/useParams.js';
import type { HelpRouteParams } from '../../routes/help-route.js';
import { helpRoute } from '../../routes/help-route.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './HelpPage.module.css';

export interface HelpPageData {
  topics: Record<string, Topic>;
}

export const HelpPage: Component = () => {
  const { topics } = useData<HelpPageData>();
  const params = useParams<HelpRouteParams>();
  const topicId = () => params['*']?.replace(/\//g, '') || '';

  let messagesRef: HTMLDivElement | undefined;

  const [historyTopicIds, setHistoryTopicIds] = createSignal<string[]>([...new Set(['', topicId()])]);
  const historyTopicEntries = (): TopicEntry[] =>
    historyTopicIds().map((id) => [id, topics[id] ?? { relatedTopicIds: [] }]);
  const openTopicIds = (): Set<string> =>
    new Set(historyTopicEntries().flatMap(([id, topic]) => [id, ...topic.relatedTopicIds]));

  const openTopicEntries = () =>
    [...Object.entries(topics)]
      .filter(([id]) => id && openTopicIds().has(id))
      .sort((a, b) => a[1].title?.localeCompare(b[1].title || '') || a[0].localeCompare(b[0]));

  createEffect(() => {
    if (historyTopicIds().at(-1) !== topicId()) {
      setHistoryTopicIds((ids) => [...ids, topicId()]);
    }

    if (messagesRef) {
      messagesRef.scrollTop = messagesRef.scrollHeight;
    }
  });

  return (
    <>
      <Divider class={styles.divider} />
      <section class={styles.container}>
        <Frame class={styles.messages} ref={messagesRef}>
          <For each={historyTopicEntries()}>
            {([_, topic]) => (
              <section class={styles.message}>
                <Show when={topic.title}>
                  <h2 class={styles.title}>{topic.title}</h2>
                </Show>
                <p class={styles.text} innerHTML={topic.html} />
              </section>
            )}
          </For>
        </Frame>
        <Frame class={styles.topics} component="ul">
          <li>Propose work</li>
          <li>Request post</li>
          <li>
            <Divider />
          </li>
          <For each={openTopicEntries()}>
            {([topicId, topic]) => (
              <li class={styles.topic}>
                <a href={helpRoute.createUrl({ topicId })}>{topic.title}</a>
              </li>
            )}
          </For>
        </Frame>
      </section>
    </>
  );
};

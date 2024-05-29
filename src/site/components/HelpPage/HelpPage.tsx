import { type Component, createEffect, createSignal, For, Show } from 'solid-js';
import { useParams } from '../../hooks/useParams.js';
import type { HelpRouteParams } from '../../routes/help-route.js';
import { helpRoute } from '../../routes/help-route.js';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './HelpPage.module.css';
import { createTopicInfo, topics } from './topics.js';

export const HelpPage: Component = () => {
  const params = useParams<HelpRouteParams>();
  const topicId = () => params['*']?.replace(/\/$/, '') || '';

  let messagesRef: HTMLDivElement | undefined;

  const [historyTopicIds, setHistoryTopicIds] = createSignal<string[]>([...new Set(['', topicId()])]);
  const historyTopicInfos = () => historyTopicIds().map((id) => createTopicInfo(topics.get(id)));

  const [openTopicIds, setOpenTopicIds] = createSignal<Set<string>>(
    new Set([topicId(), ...historyTopicInfos().flatMap((topicInfo) => topicInfo?.topicIds || [])]),
  );
  const openTopicEntries = () =>
    [...topics.entries()]
      .filter(([id]) => id && openTopicIds().has(id))
      .sort((a, b) => a[1].title.localeCompare(b[1].title));

  createEffect(() => {
    if (historyTopicIds().at(-1) !== topicId()) {
      setHistoryTopicIds((ids) => [...ids, topicId()]);
    }

    setOpenTopicIds((ids) => new Set([...ids, topicId()]));

    if (messagesRef) {
      messagesRef.scrollTop = messagesRef.scrollHeight;
    }
  });

  return (
    <>
      <Divider class={styles.divider} />
      <section class={styles.container}>
        <Frame class={styles.messages} ref={messagesRef}>
          <For each={historyTopicInfos()}>
            {(topicInfo) => (
              <section class={styles.message}>
                <Show when={topicInfo?.title}>
                  <h2 class={styles.title}>{topicInfo?.title}</h2>
                </Show>
                <p class={styles.text} innerHTML={topicInfo?.html} />
              </section>
            )}
          </For>
        </Frame>
        <Frame class={styles.topics} component="ul">
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

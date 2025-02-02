import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import type { TopicEntry } from '../../../core/entities/topic.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { helpRoute } from '../../routes/help-route.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import styles from './HelpPage.module.css';

export const HelpPage = (): JSX.Element => {
  const pageContext = usePageContext();
  const { data, params } = useRouteInfo(pageContext, helpRoute);
  const { topics } = data();
  const topicId = () => params().topicId;

  const [messageTopicIds, setMessageTopicIds] = createSignal<string[]>([...new Set(['', topicId()])]);
  const messageTopicEntries = (): TopicEntry[] =>
    messageTopicIds().map((id) => [id, topics[id] ?? { relatedTopicIds: [] }]);

  let containerRef: HTMLDivElement | undefined;
  let messagesRef: HTMLDivElement | undefined;

  const openTopicIdsFromMessages = () =>
    new Set(
      messageTopicEntries()
        .flatMap(([id, topic]) => [id, ...topic.relatedTopicIds])
        .filter(Boolean),
    );

  const [discoveredTopicIds, setDiscoveredTopicIds] = makePersisted(createSignal(openTopicIdsFromMessages()), {
    name: 'help.discoveredTopicIds',
    serialize: (data) => JSON.stringify([...data]),
    deserialize: (data) => {
      try {
        return new Set(JSON.parse(data));
      } catch {
        return new Set();
      }
    },
  });

  const [openTopicIds, setOpenTopicIds] = createSignal(openTopicIdsFromMessages());

  const openTopicEntries = () =>
    [...Object.entries(topics)]
      .filter(([id]) => id && openTopicIds().has(id))
      .sort((a, b) => a[1].title?.localeCompare(b[1].title || '') || a[0].localeCompare(b[0]));

  createEffect(() => {
    const id = topicId();

    if (messageTopicIds().at(-1) !== id) {
      setMessageTopicIds((ids) => [...ids, id]);
    }

    messagesRef?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  });

  createEffect(() => {
    const topicIds = discoveredTopicIds();
    setOpenTopicIds((ids) => new Set([...ids, ...topicIds]));
  });

  createEffect(() => {
    const topicIds = openTopicIdsFromMessages();
    setOpenTopicIds((ids) => new Set([...ids, ...topicIds]));
    setDiscoveredTopicIds((ids) => new Set([...ids, ...topicIds]));
  });

  return (
    <>
      <Frame component="main" class={styles.container} ref={containerRef}>
        <Frame class={styles.messages} ref={messagesRef}>
          <For each={messageTopicEntries()}>
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
          <li>
            <a class={styles.topic} href={createDetachedDialogFragment('subscription')}>
              Subscribe
            </a>
          </li>
          <li>
            <a class={styles.topic} href={createDetachedDialogFragment('contributing')}>
              Contribute
            </a>
          </li>
          <li>
            <a class={styles.topic} href={createDetachedDialogFragment('sponsorship')}>
              Sponsor
            </a>
          </li>
          <li>
            <Divider />
          </li>
          <For each={openTopicEntries()}>
            {([topicId, topic]) => (
              <li>
                <a class={styles.topic} href={helpRoute.createUrl({ topicId })}>
                  {topic.title}
                </a>
              </li>
            )}
          </For>
        </Frame>
      </Frame>
    </>
  );
};

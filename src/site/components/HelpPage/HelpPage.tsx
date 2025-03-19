import { makePersisted } from '@solid-primitives/storage';
import type { JSX } from 'solid-js';
import { createEffect, createResource, createSignal, For } from 'solid-js';
import { usePageContext } from 'vike-solid/usePageContext';
import { TOPIC_INDEX_ID, type TopicEntry } from '../../../core/entities/topic.js';
import { compareTopicInfosByTitle } from '../../../core/entities/topic-info.js';
import { dataManager } from '../../data-managers/manager.js';
import { useRouteInfo } from '../../hooks/useRouteInfo.js';
import { helpRoute } from '../../routes/help-route.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../Divider/Divider.js';
import { Frame } from '../Frame/Frame.js';
import { TopicMessage } from '../TopicMessage/TopicMessage.jsx';
import styles from './HelpPage.module.css';

export const HelpPage = (): JSX.Element => {
  const pageContext = usePageContext();
  const { data, params } = useRouteInfo(pageContext, helpRoute);
  const topicId = () => params().topicId;

  const indexTopicEntry = (): TopicEntry => [TOPIC_INDEX_ID, data().indexTopic];

  const currentTopicEntry = (): TopicEntry => (data().topic ? [topicId(), data().topic!] : indexTopicEntry());

  const [topicInfos] = createResource(() => dataManager.getAllTopicInfos());

  const [messageTopicEntries, setMessageTopicEntries] = createSignal<TopicEntry[]>(
    indexTopicEntry()[0] !== currentTopicEntry()[0] ? [indexTopicEntry(), currentTopicEntry()] : [indexTopicEntry()],
  );

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

  const openTopicInfos = () =>
    topicInfos()
      ?.filter((info) => openTopicIds().has(info.id))
      .sort(compareTopicInfosByTitle('asc'));

  createEffect(() => {
    const entry = currentTopicEntry();

    if (messageTopicEntries().at(-1)?.[0] !== entry[0]) {
      setMessageTopicEntries((entries) => [...entries, entry]);
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
          <For each={messageTopicEntries()}>{([_, topic]) => <TopicMessage topic={topic} />}</For>
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
          <For each={openTopicInfos()}>
            {(info) => (
              <li>
                <a class={styles.topic} href={helpRoute.createUrl({ topicId: info.id })}>
                  {info.title}
                </a>
              </li>
            )}
          </For>
        </Frame>
      </Frame>
    </>
  );
};

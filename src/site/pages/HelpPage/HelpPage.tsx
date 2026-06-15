import { makePersisted } from '@solid-primitives/storage';
import { createAsync } from '@solidjs/router';
import { createEffect, createMemo, createResource, createSignal, For, untrack } from 'solid-js';
import type { SiteRoutePage } from '../../../core/entities/site-route.js';
import { TOPIC_INDEX_ID, type TopicEntry } from '../../../core/entities/topic.js';
import { compareTopicInfosByTitle } from '../../../core/entities/topic-info.js';
import { AppPage } from '../../components/App/App.jsx';
import { createDetachedDialogFragment } from '../../components/DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Divider } from '../../components/Divider/Divider.jsx';
import { Frame } from '../../components/Frame/Frame.jsx';
import { TopicMessage } from '../../components/TopicMessage/TopicMessage.jsx';
import { dataManager } from '../../data-managers/manager.js';
import { helpRoute } from '../../routes/help-route.js';
import type { HelpPageData, HelpPageParams } from './HelpPage.data.js';
import { queryHelpPageData } from './HelpPage.data.js';
import styles from './HelpPage.module.css';

export const HelpPage: SiteRoutePage<HelpPageParams, HelpPageData> = (props) => {
  const data = createAsync(() => queryHelpPageData(props.params));

  const [topicInfos] = createResource(() => dataManager.getAllTopicInfos());

  const [messageTopicEntries, setMessageTopicEntries] = createSignal<TopicEntry[]>([]);

  let containerRef: HTMLDivElement | undefined;
  let messagesRef: HTMLDivElement | undefined;

  const openTopicIdsFromMessages = createMemo(
    () =>
      new Set(
        messageTopicEntries()
          .flatMap(([id, topic]) => [id, ...(topic?.relatedTopicIds ?? [])])
          .filter(Boolean),
      ),
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
    const entries = untrack(() => messageTopicEntries());
    const topicId = untrack(() => props.params.topicId);
    const currentData = data();

    if (currentData) {
      const { indexTopic, topic } = currentData;

      if (entries.length === 0) {
        entries.push([TOPIC_INDEX_ID, indexTopic]);
      }

      if (topicId && topic && topicId !== TOPIC_INDEX_ID) {
        entries.push([topicId, topic]);
      }

      setMessageTopicEntries([...entries]);
    }
  });

  createEffect(() => {
    const entries = messageTopicEntries();

    if (entries.length > 0) {
      messagesRef?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }
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
      <AppPage
        title={messageTopicEntries().at(-1)?.[1]?.title ?? props.params.topicId ?? ''}
        loading={!data() || topicInfos.loading}
      />

      <Frame component="main" class={styles.container} ref={containerRef}>
        <Frame class={styles.messages} ref={messagesRef}>
          <For each={messageTopicEntries()}>{(entry) => <TopicMessage topicEntry={entry} />}</For>
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

export default HelpPage;

import { createResource } from 'solid-js';
import { dataManager } from '../../data-managers/manager.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Dialog } from '../Dialog/Dialog.tsx';
import { Toast } from '../Toaster/Toaster.tsx';
import { TopicMessage } from '../TopicMessage/TopicMessage.tsx';
import styles from './TopicDialog.module.css';

const TopicDialog: DetachedDialog = (props) => {
  const [topicEntry] = createResource(
    () => props.pathname,
    (id) => (id ? dataManager.topics.getEntry(id) : undefined),
  );

  return (
    <>
      <Toast message={localize(texts.content.loadingTopic)} show={props.show && topicEntry.loading} loading />
      <Dialog
        modal
        {...props}
        show={props.show && !topicEntry.loading && Boolean(topicEntry())}
        actions={[<Button onClick={props.onClose}>{localize(texts.common.ok)}</Button>]}
      >
        <TopicMessage topicEntry={topicEntry()!} class={styles.content} />
      </Dialog>
    </>
  );
};

export { TopicDialog };
export default TopicDialog;

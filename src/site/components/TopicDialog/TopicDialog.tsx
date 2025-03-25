import { createResource } from 'solid-js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import { TopicMessage } from '../TopicMessage/TopicMessage.jsx';
import styles from './TopicDialog.module.css';

export const TopicDialog: DetachedDialog = (props) => {
  const [topicEntry] = createResource(
    () => props.pathname,
    (id) => (id ? dataManager.topics.getEntry(id) : undefined),
  );

  return (
    <>
      <Toast message="Loading Topic" show={props.show && topicEntry.loading} loading />
      <Dialog
        modal
        {...props}
        show={props.show && !topicEntry.loading && Boolean(topicEntry())}
        actions={[<Button onClick={props.onClose}>OK</Button>]}
      >
        <TopicMessage topicEntry={topicEntry()!} class={styles.content} />
      </Dialog>
    </>
  );
};

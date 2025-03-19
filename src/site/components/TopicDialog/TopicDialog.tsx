import { createResource } from 'solid-js';
import type { SiteRouteParams } from '../../../core/entities/site-route.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import { type DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import { TopicMessage } from '../TopicMessage/TopicMessage.jsx';
import styles from './TopicDialog.module.css';

export interface ContributingDialogParams extends SiteRouteParams {
  id: string;
}

export const TopicDialog: DetachedDialog<ContributingDialogParams> = (props) => {
  const [topic] = createResource(
    () => props.params,
    (params) => (params.id ? dataManager.topics.getItem(params.id) : undefined),
  );

  return (
    <>
      <Toast message="Loading Topic" show={props.show && topic.loading} loading />
      <Dialog
        modal
        {...props}
        show={props.show && !topic.loading && Boolean(topic())}
        actions={[<Button onClick={props.onClose}>OK</Button>]}
      >
        <TopicMessage topic={topic()!} class={styles.content} capitalizeTitle />
      </Dialog>
    </>
  );
};

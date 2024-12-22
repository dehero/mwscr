import { For } from 'solid-js';
import icon from '../../../../assets/icon.png?format=avif&imagetools';
import { postingServices } from '../../../core/services/index.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import styles from './SubscriptionDialog.module.css';

export const SubscriptionDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>Cancel</Button>]}>
      <div class={styles.container}>
        <img src={icon} class={styles.icon} alt="screenshot of a tree" width={240} />
        <p class={styles.title}>Morrowind Screenshots</p>
        <p class={styles.description}>
          Subscribe to the project's social media channels to join the community and receive notifications of new posts.
        </p>
        <div class={styles.buttons}>
          <For each={postingServices}>
            {(service) => (
              <Button href={service.getSubscriptionUrl()} target="_blank" onClick={props.onClose}>
                {service.name}
              </Button>
            )}
          </For>
        </div>
      </div>
    </Dialog>
  );
};

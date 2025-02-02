import { For } from 'solid-js';
import { postingServices } from '../../../core/services/index.js';
import bard from '../../images/bard.png';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './SubscriptionDialog.module.css';

export const SubscriptionDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>OK</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={bard} class={styles.icon} alt="bard class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>Subscription</p>
          <p class={styles.description}>
            Follow the project's channels in social media to stay in tune with community and receive notifications of
            new posts:
          </p>
        </section>
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

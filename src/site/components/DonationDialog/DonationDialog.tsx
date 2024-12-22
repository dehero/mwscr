import { For } from 'solid-js';
import { services } from '../../../core/services/index.js';
import thief from '../../images/thief.png';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import styles from './DonationDialog.module.css';

export const DonationDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>Cancel</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={thief} class={styles.icon} alt="thief class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>Donation</p>
          <p class={styles.description}>
            Support the project if you like. In addition to gratitude, donors get access to special author posts about
            the project's inner life:
          </p>
        </section>
        <div class={styles.buttons}>
          <For each={services.filter((service) => service.getDonationUrl)}>
            {(service) => (
              <Button href={service.getDonationUrl!()} target="_blank" onClick={props.onClose}>
                {service.donationName || service.name}
              </Button>
            )}
          </For>
        </div>
      </div>
    </Dialog>
  );
};

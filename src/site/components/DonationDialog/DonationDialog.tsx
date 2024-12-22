import { For } from 'solid-js';
import icon from '../../../../assets/icon.png?format=avif&imagetools';
import { services } from '../../../core/services/index.js';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import styles from './DonationDialog.module.css';

export const DonationDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>Cancel</Button>]}>
      <div class={styles.container}>
        <img src={icon} class={styles.icon} alt="screenshot of a tree" width={240} />
        <p class={styles.title}>Morrowind Screenshots</p>
        <p class={styles.description}>
          Donators get access to special author posts about the inner life of the project.
        </p>
        <div class={styles.buttons}>
          <For each={services.filter((service) => service.getDonationUrl)}>
            {(service) => (
              <Button href={service.getDonationUrl!()} target="_blank" onClick={props.onClose}>
                {service.name}
              </Button>
            )}
          </For>
        </div>
      </div>
    </Dialog>
  );
};

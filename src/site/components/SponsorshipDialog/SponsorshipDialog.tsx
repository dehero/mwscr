import { For } from 'solid-js';
import { services } from '../../../core/services/index.js';
import thief from '../../images/thief.png';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import styles from './SponsorshipDialog.module.css';

export const SponsorshipDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>OK</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={thief} class={styles.icon} alt="thief class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>Sponsorship</p>
          <p class={styles.description}>
            Reward separate posts if you like using the following instruments in social media:
          </p>
        </section>
        <div class={styles.buttons}>
          <For each={services.filter((service) => service.getSponsorshipUrl)}>
            {(service) => (
              <Button href={service.getSponsorshipUrl!()} target="_blank" onClick={props.onClose}>
                {service.sponsorshipName || service.name}
              </Button>
            )}
          </For>
        </div>
      </div>
    </Dialog>
  );
};

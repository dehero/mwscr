import { For } from 'solid-js';
import { services } from '../../../core/services/index.ts';
import thief from '../../images/thief.png';
import { postsRoute } from '../../routes/posts-route.ts';
import { texts } from '../../texts/index.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Dialog } from '../Dialog/Dialog.tsx';
import { Frame } from '../Frame/Frame.tsx';
import styles from './SponsorshipDialog.module.css';

const SponsorshipDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>{localize(texts.common.ok)}</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={thief} class={styles.icon} alt="thief class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>{localize(texts.support.sponsorship)}</p>
          <p class={styles.description}>
            {localize(texts.support.sponsorshipDescription, {
              merch: (parts) => (
                <a href={postsRoute.createUrl({ managerName: 'extras', type: 'merch' })} class={styles.link}>
                  {parts}
                </a>
              ),
            })}
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

export { SponsorshipDialog };
export default SponsorshipDialog;

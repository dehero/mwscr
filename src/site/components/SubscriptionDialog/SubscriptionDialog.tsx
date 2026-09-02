import { For } from 'solid-js';
import { postingServices } from '../../../core/services/index.js';
import bard from '../../images/bard.png';
import { postsRoute } from '../../routes/posts-route.js';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './SubscriptionDialog.module.css';

const SubscriptionDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>{localize(texts.common.ok)}</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={bard} class={styles.icon} alt="bard class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>{localize(texts.support.subscription)}</p>
          <p class={styles.description}>{localize(texts.support.subscriptionDescription)}</p>
        </section>
        <div class={styles.buttons}>
          <For each={postingServices.filter((service) => !service.merchOnly)}>
            {(service) => (
              <Button href={service.getSubscriptionUrl()} target="_blank" onClick={props.onClose}>
                {service.name}
              </Button>
            )}
          </For>
        </div>
        <section class={styles.heading}>
          <p class={styles.description}>
            {localize(texts.support.subscriptionMerchDescription, {
              merch: (parts) => (
                <a href={postsRoute.createUrl({ managerName: 'extras', type: 'merch' })} class={styles.link}>
                  {parts}
                </a>
              ),
            })}
          </p>
        </section>
        <div class={styles.buttons}>
          <For each={postingServices.filter((service) => service.merchOnly)}>
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

export { SubscriptionDialog };
export default SubscriptionDialog;

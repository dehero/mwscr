import { createMemo, createResource, createSignal, Show } from 'solid-js';
import { parsePostPath } from '../../../core/entities/posts-manager.js';
import { orderingScenarios } from '../../../core/scenarios/ordering.js';
import { email } from '../../../core/services/email.js';
import { postingServices } from '../../../core/services/index.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import { PostPreview } from '../PostPreview/PostPreview.jsx';
import { Select } from '../Select/Select.jsx';
import { Toast } from '../Toaster/Toaster.jsx';
import styles from './MerchOrderingDialog.module.css';

export const MerchOrderingDialog: DetachedDialog = (props) => {
  const [country, setCountry] = createSignal('Russia');
  const [otherCountry, setOtherCountry] = createSignal('');

  const pathProps = () => parsePostPath(props.pathname ?? '');
  const manager = () => (pathProps().managerName ? dataManager.findPostsManager(pathProps().managerName!) : undefined);

  const [postEntry] = createResource(
    () => (props.show ? { id: pathProps().id } : undefined),
    ({ id }) => (id ? manager()?.getEntry(id) : undefined),
  );

  const [postInfo] = createResource(
    () => (props.show ? pathProps() : undefined),
    ({ managerName, id }) => (managerName && id ? dataManager.getPostInfo(managerName, id) : undefined),
  );

  const post = () => postEntry()?.[1];

  const service = createMemo(() => {
    const scenario = orderingScenarios.find((scenario) => scenario.country === country());

    return postingServices.find(
      (service) =>
        scenario?.services.includes(service.id) &&
        post()?.posts?.some((publication) => publication.service === service.id),
    );
  });

  const publication = createMemo(() => post()?.posts?.find((publication) => publication.service === service()?.id));

  const orderButtonProps = createMemo(() => {
    if (!country()) {
      return {
        href: email.getUserMessagingUrl('mwscr@dehero.site', {
          subject: post()?.title,
          body: `Hello!\n\nPlease check if ${otherCountry()} is available to deliver "${post()?.title}" merch.`,
        }),
        target: '_blank',
        children: 'Send Email',
      };
    }

    if (!service()) {
      return;
    }

    if (!publication()) {
      return;
    }

    return {
      href: service()?.getPublicationUrl(publication()!),
      target: '_blank',
      children: `Order on ${service()!.name}`,
    };
  });

  const handleClose = () => {
    setCountry('Russia');
    setOtherCountry('');
    props.onClose();
  };

  return (
    <>
      <Toast message="Loading merch" show={props.show && postEntry.loading} loading />

      <Dialog
        {...props}
        title="Order Merch"
        actions={[
          <Show when={orderButtonProps()}>
            <Button {...orderButtonProps()} />
          </Show>,
          <Button onClick={handleClose}>Cancel</Button>,
        ]}
        modal
        contentClass={styles.container}
      >
        <Show when={postInfo()}>
          {(postInfo) => <PostPreview postInfo={postInfo()} maxHeightMultiplier={1} class={styles.preview} />}
        </Show>

        <form class={styles.form}>
          <Label label="Country" vertical>
            <div class={styles.selectWrapper}>
              <Select
                name="country"
                options={[
                  { value: undefined, label: 'CHECK MY COUNTRY' },
                  ...orderingScenarios.map((country) => ({ value: country.country })),
                ]}
                onChange={setCountry}
                value={country()}
                class={styles.select}
              />
            </div>
          </Label>

          <Show when={country() && !service()}>
            <p class={styles.text}>Sorry, there are no shipping options to selected country for now.</p>
          </Show>

          <Show when={!country()}>
            <p class={styles.text}>
              Please submit a request to let the administrator contact you later to clarify the possibility of making an
              order to your country.
            </p>

            <Label label="Check Country" vertical>
              <Input
                name="other_country"
                onChange={setOtherCountry}
                value={otherCountry()}
                class={styles.otherCountryInput}
              />
            </Label>
          </Show>

          <Show when={service()?.description}>{(description) => <p class={styles.text}>{description()}</p>}</Show>
        </form>
      </Dialog>
    </>
  );
};

import { createMemo, createResource, createSignal, For, Show } from 'solid-js';
import { parsePostPath } from '../../../core/entities/posts-manager.ts';
import { orderingScenarios } from '../../../core/scenarios/ordering.ts';
import { email } from '../../../core/services/email.ts';
import { postingServices } from '../../../core/services/index.ts';
import { dataManager } from '../../data-managers/manager.ts';
import { texts } from '../../texts/index.ts';
import { localField, localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Dialog } from '../Dialog/Dialog.tsx';
import { Input } from '../Input/Input.tsx';
import { Label } from '../Label/Label.tsx';
import { PostPreview } from '../PostPreview/PostPreview.tsx';
import { Select } from '../Select/Select.tsx';
import { Toast } from '../Toaster/Toaster.tsx';
import styles from './MerchOrderingDialog.module.css';

const MerchOrderingDialog: DetachedDialog = (props) => {
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

  const availableServices = createMemo(() => {
    const scenario = orderingScenarios.find((scenario) => scenario.country === country());

    return postingServices.filter((service) =>
      post()?.posts?.some(
        (publication) =>
          publication.service === service.id &&
          (publication.type === 'digital-product' || scenario?.services.includes(service.id)),
      ),
    );
  });

  const orderButtonProps = createMemo(() => {
    const buttons = availableServices().flatMap((service) => {
      const publications =
        post()?.posts?.filter((publication) => {
          if (publication.service !== service.id) {
            return false;
          }

          const scenario = orderingScenarios.find((scenario) => scenario.country === country());
          return publication.type === 'digital-product' || scenario?.services.includes(service.id);
        }) ?? [];

      return publications.map((publication) => ({
        href: service.getPublicationUrl(publication),
        target: '_blank',
        children: publication.variant
          ? localize(texts.support.orderVariantOn, { service: service.name, variant: publication.variant })
          : service.name,
      }));
    });

    if (country()) {
      return buttons;
    }

    return buttons;
  });

  const handleClose = () => {
    setCountry('Russia');
    setOtherCountry('');
    props.onClose();
  };

  return (
    <>
      <Toast message={localize(texts.content.loadingMerch)} show={props.show && postEntry.loading} loading />

      <Dialog
        {...props}
        title={localize(texts.support.merchOrdering)}
        actions={[<Button onClick={handleClose}>{localize(texts.common.close)}</Button>]}
        modal
        contentClass={styles.container}
      >
        <Show when={postInfo()}>
          {(postInfo) => <PostPreview postInfo={postInfo()} maxHeightMultiplier={1} class={styles.preview} />}
        </Show>

        <form class={styles.form}>
          <Label label={localize(texts.support.country)} vertical>
            <div class={styles.selectWrapper}>
              <Select
                name="country"
                options={[
                  { value: undefined, label: texts.support.checkMyCountry },
                  ...orderingScenarios
                    .map((scenario) => ({
                      value: scenario.country,
                      label: localField(scenario, 'country'),
                    }))
                    .sort((a, b) => a.label?.localeCompare(b.label ?? '') ?? 0),
                ]}
                onChange={setCountry}
                value={country()}
                class={styles.select}
              />
            </div>
          </Label>

          <Show when={country() && availableServices().length === 0}>
            <p class={styles.text}>{localize(texts.support.noShippingOptions)}</p>
          </Show>

          <Show when={!country()}>
            <p class={styles.text}>{localize(texts.support.countryRequestHint)}</p>

            <Label label={localize(texts.support.checkCountry)} vertical>
              <Input
                name="other_country"
                onChange={setOtherCountry}
                value={otherCountry()}
                class={styles.otherCountryInput}
              />
            </Label>

            <Button
              href={email.getUserMessagingUrl('mwscr@dehero.site', {
                subject: post()?.title,
                body: localize(texts.support.merchShippingRequest, { country: otherCountry(), title: post()?.title }),
              })}
              target="_blank"
            >
              {localize(texts.support.sendEmail)}
            </Button>
          </Show>

          <For each={availableServices()}>
            {(service) => {
              const scenario = orderingScenarios.find((scenario) => scenario.country === country());
              const publications = () =>
                post()?.posts?.filter(
                  (publication) =>
                    publication.service === service.id &&
                    (publication.type === 'digital-product' || scenario?.services.includes(service.id)),
                );
              const hasPhysicalPublication = () =>
                publications()?.some((publication) => publication.type !== 'digital-product');

              return (
                <Show when={hasPhysicalPublication() && localField(service, 'description')}>
                  {(description) => <p class={styles.text}>{description()}</p>}
                </Show>
              );
            }}
          </For>

          <Show when={orderButtonProps().length > 0}>
            <div class={styles.orderSection}>
              <div class={styles.orderHeading}>{localize(texts.support.orderVariants)}</div>
              <div class={styles.orderActions}>
                <For each={orderButtonProps()}>{(props) => <Button {...props} />}</For>
              </div>
            </div>
          </Show>
        </form>
      </Dialog>
    </>
  );
};

export { MerchOrderingDialog };
export default MerchOrderingDialog;

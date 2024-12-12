import clsx from 'clsx';
import { createEffect, createResource, createSignal, createUniqueId, For, splitProps } from 'solid-js';
import { EMPTY_OPTION, type Option } from '../../../core/entities/option.js';
import type { PostLocation } from '../../../core/entities/post.js';
import { mergePostLocations } from '../../../core/entities/post.js';
import { createIssueUrl as createLocateIssueUrl } from '../../../core/github-issues/location.js';
import { email } from '../../../core/services/email.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { dataExtractor } from '../../data-managers/extractor.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import { Select } from '../Select/Select.js';
import styles from './PostLocationDialog.module.css';

async function getLocationOptions(): Promise<Option[]> {
  return (await dataExtractor.getAllLocationInfos())
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((location) => ({ value: location.title, label: location.title }));
}

export type PostLocationDialogProps = Omit<DialogProps, 'title'>;

export const PostLocationDialog: DetachedDialog<PostRouteParams> = (props) => {
  const [, rest] = splitProps(props, ['params']);

  const id = () => props.params.id;
  const manager = () => props.params.managerName && dataExtractor.findPostsManager(props.params.managerName);

  const [postEntry] = createResource(
    () => (props.show ? id() : undefined),
    (id) => manager()?.getEntry(id),
  );

  createEffect(() => {
    if (postEntry.state === 'ready') {
      setPostLocation(postEntry()?.[1]?.location);
    }
  });

  const [postLocation, setPostLocation] = createSignal<PostLocation>();
  const form = createUniqueId();
  const [locationOptions] = createResource(() => props.show, getLocationOptions);
  const setLocation = (index: number, location: string | undefined) => {
    const locations = asArray(asArray(postLocation()));
    if (location) {
      if (index < locations.length) {
        locations[index] = location;
      } else {
        locations.push(location);
      }
    } else {
      locations.splice(index, 1);
    }
    setPostLocation(mergePostLocations(locations));
  };
  return (
    <Dialog
      title="Locate Post"
      {...rest}
      actions={[
        <Button href={createLocateIssueUrl(id(), postLocation())} target="_blank" onClick={props.onClose}>
          Submit via GitHub
        </Button>,
        <Button
          href={email.getUserMessagingUrl('dehero@outlook.com', {
            subject: `location - ${id()}`,
            body: asArray(postLocation()).join('\n'),
          })}
          target="_blank"
          onClick={props.onClose}
        >
          Send via email
        </Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
    >
      <form id={form} class={styles.form}>
        <Label label="Location" class={styles.location} vertical>
          <fieldset class={clsx(styles.fieldset, styles.locations)}>
            <For each={asArray(postLocation())}>
              {(location, index) => (
                <div class={styles.selectWrapper}>
                  <Select
                    options={[{ label: '[Remove]', value: EMPTY_OPTION.value }, ...(locationOptions() ?? [])]}
                    name="author"
                    value={location}
                    onChange={(location) => setLocation(index(), location)}
                    class={styles.select}
                  />
                </div>
              )}
            </For>
            <div class={styles.selectWrapper}>
              <Select
                options={[{ label: '[Add]', value: EMPTY_OPTION.value }, ...(locationOptions() ?? [])]}
                name="location"
                value={undefined}
                onChange={(location) => setLocation(asArray(postLocation()).length, location)}
                class={styles.select}
              />
            </div>
          </fieldset>
        </Label>
      </form>
    </Dialog>
  );
};

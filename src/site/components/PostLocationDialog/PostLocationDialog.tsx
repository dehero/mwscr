import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createResource, createSignal, createUniqueId, For, splitProps } from 'solid-js';
import { EMPTY_OPTION, type Option } from '../../../core/entities/option.js';
import { mergePostLocations, type PostEntry } from '../../../core/entities/post.js';
import { createIssueUrl as createLocateIssueUrl } from '../../../core/github-issues/location.js';
import { email } from '../../../core/services/email.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { dataExtractor } from '../../data-managers/extractor.js';
import { Button } from '../Button/Button.js';
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

export interface PostLocationDialogProps extends Omit<DialogProps, 'title'> {
  postEntry: PostEntry;
}

export const PostLocationDialog: Component<PostLocationDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [postLocation, setPostLocation] = createSignal(local.postEntry[1].location);
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

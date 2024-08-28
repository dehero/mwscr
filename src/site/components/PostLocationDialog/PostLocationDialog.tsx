import type { Component } from 'solid-js';
import { createResource, createSignal, createUniqueId, splitProps } from 'solid-js';
import { EMPTY_OPTION, type Option } from '../../../core/entities/option.js';
import type { PostEntry } from '../../../core/entities/post.js';
import { createIssueUrl as createLocateIssueUrl } from '../../../core/github-issues/location.js';
import { email } from '../../../core/services/email.js';
import { locations } from '../../data-managers/locations.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import { Select } from '../Select/Select.js';
import styles from './PostLocationDialog.module.css';

async function getLocationOptions(): Promise<Option[]> {
  return (await locations.getAllEntries())
    .sort((a, b) => a[1].title.localeCompare(b[1].title))
    .map((location) => ({ value: location[0], label: location[1].title }));
}

export interface PostLocationDialogProps extends Omit<DialogProps, 'title'> {
  postEntry: PostEntry;
}

export const PostLocationDialog: Component<PostLocationDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [postLocation, setPostLocation] = createSignal(local.postEntry[1].location);
  const form = createUniqueId();

  const [locationOptions] = createResource(getLocationOptions);

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
            body: postLocation(),
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
        <Label label="Location" vertical>
          <div class={styles.selectWrapper}>
            <Select
              name="location"
              options={[EMPTY_OPTION, ...(locationOptions() ?? [])]}
              value={postLocation()}
              onChange={setPostLocation}
              class={styles.select}
            />
          </div>
        </Label>
      </form>
    </Dialog>
  );
};

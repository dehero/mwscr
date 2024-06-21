import type { Component } from 'solid-js';
import { createResource, createSignal, createUniqueId, splitProps } from 'solid-js';
import type { Post, PostEntry } from '../../../core/entities/post.js';
import { createIssueUrl as createEditIssueUrl } from '../../../core/github-issues/editing.js';
import { locations } from '../../data-managers/locations.js';
import { EMPTY_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import type { SelectOption } from '../Select/Select.js';
import { Select } from '../Select/Select.js';
import styles from './PostLocationDialog.module.css';

async function getLocationOptions(): Promise<SelectOption<string>[]> {
  return (await locations.getAllEntries())
    .sort((a, b) => a[1].title.localeCompare(b[1].title))
    .map((location) => ({ value: location[0], label: location[1].title }));
}

export interface PostLocationDialogProps extends Omit<DialogProps, 'title'> {
  postEntry: PostEntry<Post>;
}

export const PostLocationDialog: Component<PostLocationDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [post, setPost] = createSignal(local.postEntry[1]);
  const form = createUniqueId();

  const setPostLocation = (location: string | undefined) => setPost({ ...post(), location });

  const [locationOptions] = createResource(getLocationOptions);

  return (
    <Dialog
      title="Locate Post"
      {...rest}
      actions={[
        <Button href={createEditIssueUrl(id(), post())} target="_blank">
          Create Issue
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
              value={post().location}
              onChange={setPostLocation}
              class={styles.select}
            />
          </div>
        </Label>
      </form>
    </Dialog>
  );
};

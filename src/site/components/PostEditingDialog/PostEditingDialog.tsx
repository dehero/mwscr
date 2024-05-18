import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createResource, createSignal, createUniqueId, splitProps } from 'solid-js';
import type {
  Post,
  PostAddon,
  PostEngine,
  PostEntry,
  PostMark,
  PostType,
  PostViolation,
} from '../../../core/entities/post.js';
import { POST_ADDONS, POST_ENGINES, POST_MARKS, POST_TYPES, POST_VIOLATIONS } from '../../../core/entities/post.js';
import { createIssueUrl as createEditIssueUrl } from '../../../core/github-issues/editing.js';
import { asArray } from '../../../core/utils/common-utils.js';
import { dateToString } from '../../../core/utils/date-utils.js';
import { locations } from '../../data-managers/locations.js';
import { EMPTY_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import frameStyles from '../Frame/Frame.module.css';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { PostContentEditor } from '../PostContentEditor/PostContentEditor.js';
import type { SelectOption } from '../Select/Select.js';
import { Select } from '../Select/Select.js';
import styles from './PostEditingDialog.module.css';

async function getLocationOptions(): Promise<SelectOption<string>[]> {
  return (await locations.getAllEntries())
    .sort((a, b) => a[1].title.localeCompare(b[1].title))
    .map((location) => ({ value: location[0], label: location[1].title }));
}

export interface PostEditingDialogProps extends Omit<DialogProps, 'title'> {
  postEntry: PostEntry<Post>;
}

export const PostEditingDialog: Component<PostEditingDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [post, setPost] = createSignal(local.postEntry[1]);
  const form = createUniqueId();

  const setPostContentAndTrash = ({ content, trash }: Pick<Post, 'content' | 'trash'>) =>
    setPost({ ...post(), content, trash });
  const setPostTitle = (title: string) => setPost({ ...post(), title });
  const setPostTitleRu = (titleRu: string) => setPost({ ...post(), titleRu });
  const setPostDescription = (description: string) => setPost({ ...post(), description });
  const setPostDescriptionRu = (descriptionRu: string) => setPost({ ...post(), descriptionRu });
  const setPostType = (type: PostType = 'shot') => setPost({ ...post(), type });
  const setPostEngine = (engine: PostEngine | undefined) => setPost({ ...post(), engine });
  const setPostAddon = (addon: PostAddon | undefined) => setPost({ ...post(), addon });
  const setPostMark = (mark: PostMark | undefined) => setPost({ ...post(), mark });
  const setPostViolation = (violation: PostViolation | undefined) => setPost({ ...post(), violation });
  const setPostLocation = (location: string | undefined) => setPost({ ...post(), location });

  const [locationOptions] = createResource(getLocationOptions);

  return (
    <Dialog
      title="Edit Post"
      {...rest}
      actions={[
        <Button href={createEditIssueUrl(id(), post())} target="_blank">
          Create Issue
        </Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
    >
      <form id={form} class={styles.form}>
        <PostContentEditor value={post()} onChange={setPostContentAndTrash} />

        <Label label="Location" class={styles.location} vertical>
          <Select
            name="location"
            options={[EMPTY_OPTION, ...(locationOptions() ?? [])]}
            value={post().location}
            onChange={setPostLocation}
          />
        </Label>

        <fieldset class={clsx(styles.main)}>
          <Label label="Type">
            <Select
              name="type"
              options={POST_TYPES.map((value) => ({ value }))}
              value={post().type}
              onChange={setPostType}
            />
          </Label>

          <Label label="Title" vertical>
            <Input name="title" value={post().title} onChange={setPostTitle} class={styles.title} />
          </Label>

          <Label label="Title on Russian" vertical>
            <Input name="titleRu" value={post().titleRu} onChange={setPostTitleRu} class={styles.title} />
          </Label>

          <Label label="Description" vertical>
            <Input
              name="description"
              value={post().description}
              onChange={setPostDescription}
              multiline
              rows={5}
              class={styles.input}
            />
          </Label>

          <Label label="Description on Russian" vertical>
            <Input
              name="descriptionRu"
              value={post().descriptionRu}
              onChange={setPostDescriptionRu}
              multiline
              rows={5}
              class={styles.input}
            />
          </Label>

          <Label label="Author" vertical>
            <Input name="author" value={asArray(post().author).join(' ')} class={styles.input} />
          </Label>
        </fieldset>

        <fieldset class={clsx(styles.fieldset, styles.secondary)}>
          <Label label="Engine">
            <Select
              name="engine"
              options={[EMPTY_OPTION, ...POST_ENGINES.map((value) => ({ value }))]}
              value={post().engine}
              onChange={setPostEngine}
              class={styles.input}
            />
          </Label>

          <Label label="Addon">
            <Select
              name="addon"
              options={[EMPTY_OPTION, ...POST_ADDONS.map((value) => ({ value }))]}
              value={post().addon}
              onChange={setPostAddon}
            />
          </Label>

          <Label label="Tags" vertical>
            <Input name="postTags" value={asArray(post().tags).join(' ')} class={styles.input} />
          </Label>

          <fieldset class={clsx(frameStyles.thin, styles.request)}>
            <Label label="Request" vertical>
              <Input name="request[text]" value={post().request?.text} multiline rows={3} class={styles.requestText} />
            </Label>

            <Label label="On">
              <Input
                name="request[date]"
                value={post().request?.date ? dateToString(post()!.request!.date) : ''}
                class={styles.requestDate}
              />
            </Label>

            <Label label="By">
              <Input name="request[user]" value={post().request?.user} class={styles.requestUser} />
            </Label>
          </fieldset>

          <Label label="Editor's Mark">
            <Select
              name="mark"
              options={[EMPTY_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
              value={post().mark}
              onChange={setPostMark}
            />
          </Label>

          <Label label="Violation">
            <Select
              name="violation"
              options={[
                EMPTY_OPTION,
                ...Object.entries(POST_VIOLATIONS).map(([value, violation]) => ({
                  value: value as PostViolation,
                  label: violation.title,
                })),
              ]}
              value={post().violation}
              onChange={setPostViolation}
            />
          </Label>
        </fieldset>
      </form>
    </Dialog>
  );
};

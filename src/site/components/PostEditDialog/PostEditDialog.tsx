import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createSignal, createUniqueId, splitProps } from 'solid-js';
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
import { EMPTY_OPTION } from '../../utils/ui-constants.js';
import { Button } from '../Button/Button.jsx';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import frameStyles from '../Frame/Frame.module.css';
import { Input } from '../Input/Input.js';
import { Select } from '../Select/Select.js';
import styles from './PostEditDialog.module.css';

export interface PostEditDialogProps extends Omit<DialogProps, 'title'> {
  postEntry: PostEntry<Post>;
}

export const PostEditDialog: Component<PostEditDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [post, setPost] = createSignal(local.postEntry[1]);
  const form = createUniqueId();

  const setPostTitle = (title: string) => setPost({ ...post(), title });
  const setPostTitleRu = (titleRu: string) => setPost({ ...post(), titleRu });
  const setPostDescription = (description: string) => setPost({ ...post(), description });
  const setPostDescriptionRu = (descriptionRu: string) => setPost({ ...post(), descriptionRu });
  const setPostType = (type: PostType = 'shot') => setPost({ ...post(), type });
  const setPostEngine = (engine: PostEngine | undefined) => setPost({ ...post(), engine });
  const setPostAddon = (addon: PostAddon | undefined) => setPost({ ...post(), addon });
  const setPostMark = (mark: PostMark | undefined) => setPost({ ...post(), mark });
  const setPostViolation = (violation: PostViolation | undefined) => setPost({ ...post(), violation });

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
        <Input
          label="Title"
          name="postTitle"
          value={post().title}
          onChange={setPostTitle}
          vertical
          class={styles.title}
        />

        <Input
          label="Title on Russian"
          name="postTitleRu"
          value={post().titleRu}
          onChange={setPostTitleRu}
          vertical
          class={styles.title}
        />

        <Input
          label="Description"
          name="postDescription"
          value={post().description}
          onChange={setPostDescription}
          vertical
          multiline
          rows={5}
          class={styles.input}
        />

        <Input
          label="Description on Russian"
          name="descriptionRu"
          value={post().descriptionRu}
          onChange={setPostDescriptionRu}
          vertical
          multiline
          rows={5}
          class={styles.input}
        />

        <Input label="Author" name="author" value={asArray(post().author).join(' ')} vertical class={styles.input} />

        <Select
          label="Type"
          name="type"
          options={POST_TYPES.map((value) => ({ value }))}
          value={post().type}
          onChange={setPostType}
        />

        <Input label="Location" name="postLocation" value={post().location} vertical class={styles.input} />

        <Input label="Tags" name="postTags" value={asArray(post().tags).join(' ')} vertical class={styles.input} />

        <Select
          label="Engine"
          name="engine"
          options={[EMPTY_OPTION, ...POST_ENGINES.map((value) => ({ value }))]}
          value={post().engine}
          onChange={setPostEngine}
          class={styles.input}
        />

        <Select
          label="Addon"
          name="addon"
          options={[EMPTY_OPTION, ...POST_ADDONS.map((value) => ({ value }))]}
          value={post().addon}
          onChange={setPostAddon}
        />

        <fieldset class={clsx(frameStyles.thin, styles.fieldset)}>
          <Input label="Request Text" value={post().request?.text} vertical class={styles.input} />

          <Input
            label="Request Date"
            value={post().request?.date ? dateToString(post()!.request!.date) : ''}
            vertical
            class={styles.input}
          />

          <Input label="Request User" value={post().request?.user} vertical class={styles.input} />
        </fieldset>

        <Select
          label="Editor's Mark"
          name="mark"
          options={[EMPTY_OPTION, ...POST_MARKS.map((value) => ({ value }))]}
          value={post().mark}
          onChange={setPostMark}
        />

        <Select
          label="Violation"
          name="violation"
          options={[
            EMPTY_OPTION,
            ...Object.entries(POST_VIOLATIONS).map(([value, label]) => ({ value: value as PostViolation, label })),
          ]}
          value={post().violation}
          onChange={setPostViolation}
        />
      </form>
    </Dialog>
  );
};

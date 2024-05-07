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
import { PostContentEditor } from '../PostContentEditor/PostContentEditor.js';
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

        <fieldset class={clsx(styles.main)}>
          <Select
            label="Type"
            name="type"
            options={POST_TYPES.map((value) => ({ value }))}
            value={post().type}
            onChange={setPostType}
          />

          <Input
            label="Title"
            name="title"
            value={post().title}
            onChange={setPostTitle}
            vertical
            class={styles.title}
          />

          <Input
            label="Title on Russian"
            name="titleRu"
            value={post().titleRu}
            onChange={setPostTitleRu}
            vertical
            class={styles.title}
          />

          <Input
            label="Description"
            name="description"
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
        </fieldset>

        <fieldset class={clsx(styles.fieldset, styles.secondary)}>
          <Input label="Location" name="postLocation" value={post().location} class={styles.input} />

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

          <Input label="Tags" name="postTags" value={asArray(post().tags).join(' ')} vertical class={styles.input} />

          <fieldset class={clsx(frameStyles.thin, styles.request)}>
            <Input
              label="Request"
              name="request[text]"
              value={post().request?.text}
              multiline
              rows={3}
              vertical
              class={styles.requestText}
            />

            <Input
              label="On"
              name="request[date]"
              value={post().request?.date ? dateToString(post()!.request!.date) : ''}
              class={styles.requestDate}
            />

            <Input label="By" name="request[user]" value={post().request?.user} class={styles.requestUser} />
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
        </fieldset>
      </form>
    </Dialog>
  );
};

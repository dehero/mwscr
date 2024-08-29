import type { Component } from 'solid-js';
import { createSignal, createUniqueId, splitProps } from 'solid-js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { PostEntry, PostMark, PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_VIOLATIONS } from '../../../core/entities/post.js';
import { createIssueUrl } from '../../../core/github-issues/review.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import { Select } from '../Select/Select.js';
import styles from './PostReviewDialog.module.css';

export interface PostReviewDialogProps extends Omit<DialogProps, 'title' | 'modal' | 'actions' | 'summary'> {
  postEntry: PostEntry;
}

export const PostReviewDialog: Component<PostReviewDialogProps> = (props) => {
  const [local, rest] = splitProps(props, ['postEntry']);
  const id = () => local.postEntry[0];
  const [post, setPost] = createSignal(local.postEntry[1]);
  const form = createUniqueId();

  const setPostMark = (mark: PostMark | undefined) => setPost({ ...post(), mark });
  const setPostViolation = (violation: PostViolation | undefined) => setPost({ ...post(), violation });

  return (
    <Dialog
      title="Review Post"
      {...rest}
      actions={[
        <Button href={createIssueUrl(id(), post())} onClick={props.onClose} target="_blank">
          Submit via GitHub
        </Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
      modal
    >
      <form id={form} class={styles.form}>
        <Label label="Editor's Mark" vertical>
          <Select
            name="mark"
            options={[EMPTY_OPTION, ...POST_MARKS.map(({ id }) => ({ value: id }))]}
            value={post().mark}
            onChange={setPostMark}
            class={styles.select}
          />
        </Label>

        <Label label="Violation" vertical>
          <div class={styles.selectWrapper}>
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
              class={styles.select}
            />
          </div>
        </Label>
      </form>
    </Dialog>
  );
};

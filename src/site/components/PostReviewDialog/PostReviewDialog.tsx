import { createEffect, createResource, createSignal, createUniqueId, splitProps } from 'solid-js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { Post, PostMark, PostViolation } from '../../../core/entities/post.js';
import { POST_MARKS, POST_VIOLATIONS } from '../../../core/entities/post.js';
import { createIssueUrl } from '../../../core/github-issues/review.js';
import { dataExtractor } from '../../data-managers/extractor.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import { Select } from '../Select/Select.js';
import styles from './PostReviewDialog.module.css';

export const PostReviewDialog: DetachedDialog<PostRouteParams> = (props) => {
  const [, rest] = splitProps(props, ['params']);

  const id = () => props.params.id;
  const manager = () => props.params.managerName && dataExtractor.findPostsManager(props.params.managerName);

  const [postEntry] = createResource(
    () => (props.show ? id() : undefined),
    (id) => manager()?.getEntry(id),
  );

  createEffect(() => {
    if (postEntry.state === 'ready') {
      setPost(postEntry()?.[1] ?? {});
    }
  });

  const [post, setPost] = createSignal<Partial<Post>>({});
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

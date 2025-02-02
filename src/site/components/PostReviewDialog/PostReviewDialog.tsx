import { createEffect, createResource, createSignal, createUniqueId, splitProps } from 'solid-js';
import { EMPTY_OPTION } from '../../../core/entities/option.js';
import type { Post } from '../../../core/entities/post.js';
import { PostMark, PostViolation, postViolationDescriptors } from '../../../core/entities/post.js';
import { createIssueUrl } from '../../../core/github-issues/post-review.js';
import { dataManager } from '../../data-managers/manager.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Label } from '../Label/Label.js';
import { Select } from '../Select/Select.js';
import { Toast } from '../Toaster/Toaster.jsx';
import styles from './PostReviewDialog.module.css';

export const PostReviewDialog: DetachedDialog<PostRouteParams> = (props) => {
  const [, rest] = splitProps(props, ['params', 'show']);

  const id = () => props.params.id;
  const manager = () => props.params.managerName && dataManager.findPostsManager(props.params.managerName);

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

  const isLoading = () => postEntry.loading;

  return (
    <>
      <Toast message="Loading Post" show={props.show && isLoading()} loading />
      <Dialog
        title="Review Post"
        show={props.show && !isLoading()}
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
              options={[EMPTY_OPTION, ...PostMark.options.map((value) => ({ value }))]}
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
                  ...PostViolation.options.map((value) => ({
                    value,
                    label: postViolationDescriptors[value].title,
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
    </>
  );
};

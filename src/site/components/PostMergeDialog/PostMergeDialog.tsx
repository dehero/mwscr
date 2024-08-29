import { type Component, createSignal } from 'solid-js';
import { createIssueUrl } from '../../../core/github-issues/merging.js';
import { Button } from '../Button/Button.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import styles from './PostMergeDialog.module.css';

export interface PostMergeDialogProps extends Omit<DialogProps, 'title' | 'modal' | 'actions'> {
  postId: string;
}

export const PostMergeDialog: Component<PostMergeDialogProps> = (props) => {
  const [text, setText] = createSignal('');

  return (
    <Dialog
      title="Merge Post"
      modal
      {...props}
      actions={[
        <Button href={createIssueUrl(props.postId, text().split(/\r?\n/))} target="_blank" onClick={props.onClose}>
          Submit via GitHub
        </Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
    >
      <Label label="Merge with post IDs" vertical>
        <Input value={text()} onChange={setText} multiline rows={5} class={styles.input} />
      </Label>
    </Dialog>
  );
};

import { createSignal, splitProps } from 'solid-js';
import { createIssueUrl } from '../../../core/github-issues/post-merging.js';
import type { PostRouteParams } from '../../routes/post-route.js';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import styles from './PostMergeDialog.module.css';

export const PostMergeDialog: DetachedDialog<PostRouteParams> = (props) => {
  const [, rest] = splitProps(props, ['params']);
  const [text, setText] = createSignal('');

  return (
    <Dialog
      title="Merge Post"
      modal
      {...rest}
      actions={[
        <Button href={createIssueUrl(props.params.id, text().split(/\r?\n/))} target="_blank" onClick={props.onClose}>
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

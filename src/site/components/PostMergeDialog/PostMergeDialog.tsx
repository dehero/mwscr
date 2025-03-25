import { createSignal, splitProps } from 'solid-js';
import { createIssueUrl } from '../../../core/github-issues/post-merging.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Input } from '../Input/Input.jsx';
import { Label } from '../Label/Label.jsx';
import styles from './PostMergeDialog.module.css';

export const PostMergeDialog: DetachedDialog = (props) => {
  const [, rest] = splitProps(props, ['params']);
  const [text, setText] = createSignal('');

  const handlePatch = () => {
    const id = props.params.id;
    const manager = props.params.managerName ? dataManager.findPostsManager(props.params.managerName) : undefined;

    if (id && manager) {
      const mergedIds = text()
        .split(/\r?\n/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      manager.mergePatch({
        // [id]: props.params.id,
        ...Object.fromEntries(mergedIds.map((id) => [id, null])),
      });
    }
    props.onClose();
  };

  return (
    <Dialog
      title="Merge Post"
      modal
      {...rest}
      actions={[
        <Button href={createIssueUrl(props.params.id, text().split(/\r?\n/))} target="_blank" onClick={props.onClose}>
          Submit via GitHub
        </Button>,
        <Button onClick={handlePatch}>Patch</Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
    >
      <Label label="Merge with post IDs" vertical>
        <Input value={text()} onChange={setText} multiline rows={5} class={styles.input} />
      </Label>
    </Dialog>
  );
};

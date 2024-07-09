import type { Component } from 'solid-js';
import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/proposal.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import styles from './PostProposalDialog.module.css';

type PostProposalDialogProps = Omit<DialogProps, 'title' | 'modal'>;

export const PostProposalDialog: Component<PostProposalDialogProps> = (props) => {
  return (
    <Dialog modal {...props}>
      <div class={styles.container}>
        <Button href={createProposalIssueUrl()} target="_blank">
          Send proposal via GitHub Issues
        </Button>
        <Button href="mailto:dehero@outlook.com?subject=mwscr" target="_blank">
          Send to administrator via email
        </Button>
        <Button onClick={props.onClose}>Cancel</Button>
      </div>
    </Dialog>
  );
};

import type { Component } from 'solid-js';
import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/proposal.js';
import { email } from '../../../core/services/email.js';
import { Button } from '../Button/Button.js';
import type { DialogProps } from '../Dialog/Dialog.js';
import { Dialog } from '../Dialog/Dialog.js';
import styles from './PostProposalDialog.module.css';

type PostProposalDialogProps = Omit<DialogProps, 'title' | 'modal'>;

export const PostProposalDialog: Component<PostProposalDialogProps> = (props) => {
  return (
    <Dialog modal {...props}>
      <div class={styles.container}>
        <Button href={createProposalIssueUrl()} target="_blank" onClick={props.onClose}>
          Submit via GitHub
        </Button>
        <Button
          href={email.getUserMessagingUrl('dehero@outlook.com', {
            subject: 'proposal',
            body: "Hello! I've attached .zip archive with works I'd like to propose. Please consider taking them to Inbox. Thank you!",
          })}
          target="_blank"
          onClick={props.onClose}
        >
          Send via email
        </Button>
        <Button onClick={props.onClose}>Cancel</Button>
      </div>
    </Dialog>
  );
};

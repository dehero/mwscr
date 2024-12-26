import { createIssueUrl as createProposalIssueUrl } from '../../../core/github-issues/post-proposal.js';
import { email } from '../../../core/services/email.js';
import { telegram, TELEGRAM_BOT_NAME } from '../../../core/services/telegram.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import styles from './PostProposalDialog.module.css';

export const PostProposalDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props}>
      <div class={styles.container}>
        <p class={styles.title}>Propose work</p>
        <Button href={telegram.getUserProfileUrl(TELEGRAM_BOT_NAME)} target="_blank" onClick={props.onClose}>
          Send to Telegram bot
        </Button>
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

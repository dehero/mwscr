import { createSignal } from 'solid-js';
import { createIssueUrl as createRequestIssueUrl } from '../../../core/github-issues/request.js';
import { email } from '../../../core/services/email.js';
import { Button } from '../Button/Button.js';
import type { DetachedDialog } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';

export const PostRequestDialog: DetachedDialog = (props) => {
  const [text, setText] = createSignal('');

  return (
    <Dialog
      modal
      {...props}
      actions={[
        <Button href={createRequestIssueUrl(text())} target="_blank" onClick={props.onClose}>
          Submit via GitHub
        </Button>,
        <Button
          href={email.getUserMessagingUrl('dehero@outlook.com', { subject: 'request', body: text() })}
          target="_blank"
          onClick={props.onClose}
        >
          Send via email
        </Button>,
        <Button onClick={props.onClose}>Cancel</Button>,
      ]}
    >
      <Label label="Request" vertical>
        <Input value={text()} onChange={setText} multiline rows={5} />
      </Label>
    </Dialog>
  );
};

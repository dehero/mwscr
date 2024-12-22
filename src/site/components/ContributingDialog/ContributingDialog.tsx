import { NONE_OPTION } from '../../../core/entities/option.js';
import mage from '../../images/mage.png';
import { postsRoute } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.jsx';
import {
  createDetachedDialogFragment,
  type DetachedDialog,
} from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import styles from './ContributingDialog.module.css';

export const ContributingDialog: DetachedDialog = (props) => {
  return (
    <Dialog modal {...props} actions={[<Button onClick={props.onClose}>Cancel</Button>]}>
      <div class={styles.container}>
        <Frame component="img" src={mage} class={styles.icon} alt="mage class" width={256} />
        <section class={styles.heading}>
          <p class={styles.title}>Contributing</p>
          <p class={styles.description}>
            Everyone is welcome to participate in the project. Be sure to read the{' '}
            <a href="https://github.com/dehero/mwscr/blob/main/CONTRIBUTING.md" class={styles.link} target="_blank">
              Contributing Guidelines
            </a>{' '}
            in advance, then proceed:
          </p>
        </section>
        <div class={styles.buttons}>
          <Button href={createDetachedDialogFragment('post-proposal')} onClick={props.onClose}>
            Propose Work
          </Button>

          <Button href={createDetachedDialogFragment('post-request')} onClick={props.onClose}>
            Request Post
          </Button>

          <Button
            href={postsRoute.createUrl({ managerName: 'posts', location: NONE_OPTION.value })}
            onClick={props.onClose}
          >
            Find Post Location
          </Button>
        </div>
        {/* </Frame> */}
      </div>
    </Dialog>
  );
};

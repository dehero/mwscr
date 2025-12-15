import { Match, Switch } from 'solid-js';
import { NONE_OPTION } from '../../../core/entities/option.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postsRoute } from '../../routes/posts-route.js';
import { Button } from '../Button/Button.jsx';
import { DataPatchEditor } from '../DataPatchEditor/DataPatchEditor.jsx';
import {
  createDetachedDialogFragment,
  type DetachedDialog,
} from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Icon } from '../Icon/Icon.jsx';
import styles from './ContributingDialog.module.css';

export type ContributingDialogTab = 'patch' | 'variants';

export const ContributingDialog: DetachedDialog<ContributingDialogTab> = (props) => {
  const tab = () => props.pathname ?? 'variants';
  const patchSize = useLocalPatch();

  return (
    <Dialog
      title="Contributing"
      modal
      {...props}
      actions={[<Button onClick={props.onClose}>OK</Button>]}
      summary={
        <a href="https://github.com/dehero/mwscr/blob/main/CONTRIBUTING.md" class={styles.link} target="_blank">
          Guidelines
        </a>
      }
    >
      <div class={styles.container}>
        <div class={styles.tabs}>
          <Button active={tab() === 'variants'} href={createDetachedDialogFragment('contributing', 'variants')}>
            Variants
          </Button>
          <Button active={tab() === 'patch'} href={createDetachedDialogFragment('contributing', 'patch')}>
            Edits {patchSize() > 0 ? ` (${patchSize()})` : ''}
          </Button>
        </div>

        <Frame class={styles.tabContent}>
          <Switch>
            <Match when={tab() === 'variants'}>
              <div class={styles.variants}>
                <Frame
                  component="a"
                  href={createDetachedDialogFragment('post-proposal')}
                  onClick={props.onClose}
                  variant="thin"
                  class={styles.variant}
                >
                  <Icon color="stealth" class={styles.variantIcon}>
                    S
                  </Icon>
                  <p class={styles.variantTitle}>Submit Files</p>
                  <p class={styles.variantDescription}>Add your images or videos to Drafts.</p>
                </Frame>

                <Frame
                  component="a"
                  href={
                    postsRoute.createUrl({ managerName: 'posts', type: 'shot', original: 'true' }) +
                    createDetachedDialogFragment('topic', 'creating-compilation')
                  }
                  onClick={props.onClose}
                  variant="thin"
                  class={styles.variant}
                >
                  <Icon color="stealth" class={styles.variantIcon}>
                    C
                  </Icon>
                  <p class={styles.variantTitle}>Create Compilation</p>
                  <p class={styles.variantDescription}>Combine published shots into your own compilation.</p>
                </Frame>

                <Frame
                  component="a"
                  href={createDetachedDialogFragment('post-request')}
                  onClick={props.onClose}
                  variant="thin"
                  class={styles.variant}
                >
                  <Icon color="magic" class={styles.variantIcon}>
                    R
                  </Icon>
                  <p class={styles.variantTitle}>Request Themed Post</p>
                  <p class={styles.variantDescription}>Ask the authors to make a certain post.</p>
                </Frame>

                <Frame
                  component="a"
                  href={
                    postsRoute.createUrl({ managerName: 'posts', location: NONE_OPTION.value, original: 'true' }) +
                    createDetachedDialogFragment('topic', 'suggesting-location')
                  }
                  onClick={props.onClose}
                  variant="thin"
                  class={styles.variant}
                >
                  <Icon color="magic" class={styles.variantIcon}>
                    L
                  </Icon>
                  <p class={styles.variantTitle}>Find Missing Location</p>
                  <p class={styles.variantDescription}>
                    Suggest shooting location of screenshot or video if not specified in the post.
                  </p>
                </Frame>
              </div>
            </Match>

            <Match when={tab() === 'patch'}>
              <DataPatchEditor class={styles.patchEditor} />
            </Match>
          </Switch>
        </Frame>
      </div>
    </Dialog>
  );
};

import { Match, Switch } from 'solid-js';
import { NONE_OPTION } from '../../../core/entities/option.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postsRoute } from '../../routes/posts-route.js';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import { Button } from '../Button/Button.jsx';
import { DataPatchEditor } from '../DataPatchEditor/DataPatchEditor.jsx';
import {
  createDetachedDialogFragment,
  type DetachedDialog,
} from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Icon } from '../Icon/Icon.jsx';
import { SettingsEditor } from '../SettingsEditor/SettingsEditor.jsx';
import styles from './ContributingDialog.module.css';

export type ContributingDialogTab = 'patch' | 'variants' | 'settings';

const ContributingDialog: DetachedDialog<ContributingDialogTab> = (props) => {
  const tab = () => props.pathname ?? 'variants';
  const [patchSize] = useLocalPatch();

  let creatingCompilationRef;

  return (
    <Dialog
      title={localize(texts.contributing.contributing)}
      modal
      {...props}
      actions={[<Button onClick={props.onClose}>{localize(texts.common.ok)}</Button>]}
      contentClass={styles.container}
      summary={
        <>
          <a href="https://github.com/dehero/mwscr/blob/main/CONTRIBUTING.md" class={styles.link} target="_blank">
            {localize(texts.contributing.guidelines)}
          </a>
          {' • '}
          <a href="/users/dehero" class={styles.link} target="_blank">
            {localize(texts.user.admin)}
          </a>
        </>
      }
    >
      <div class={styles.tabs}>
        <Button active={tab() === 'variants'} href={createDetachedDialogFragment('contributing', 'variants')}>
          {localize(texts.contributing.variants)}
        </Button>
        <Button active={tab() === 'patch'} href={createDetachedDialogFragment('contributing', 'patch')}>
          {patchSize() > 0
            ? localize(texts.editing.editsWithCount, { count: patchSize() })
            : localize(texts.editing.edits)}
        </Button>
        <Button active={tab() === 'settings'} href={createDetachedDialogFragment('contributing', 'settings')}>
          {localize(texts.contributing.settings)}
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
                <p class={styles.variantTitle}>{localize(texts.contributing.submitFiles)}</p>
                <p class={styles.variantDescription}>{localize(texts.contributing.submitFilesDescription)}</p>
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
                ref={creatingCompilationRef}
              >
                <Icon color="stealth" class={styles.variantIcon}>
                  C
                </Icon>
                <p class={styles.variantTitle}>{localize(texts.contributing.createCompilation)}</p>
                <p class={styles.variantDescription}>{localize(texts.contributing.createCompilationDescription)}</p>
              </Frame>

              <Frame
                component="a"
                href={createDetachedDialogFragment('post-request', 'drafts')}
                onClick={props.onClose}
                variant="thin"
                class={styles.variant}
              >
                <Icon color="magic" class={styles.variantIcon}>
                  R
                </Icon>
                <p class={styles.variantTitle}>{localize(texts.contributing.requestThemedPost)}</p>
                <p class={styles.variantDescription}>{localize(texts.contributing.requestThemedPostDescription)}</p>
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
                <p class={styles.variantTitle}>{localize(texts.contributing.findMissingLocation)}</p>
                <p class={styles.variantDescription}>{localize(texts.contributing.findMissingLocationDescription)}</p>
              </Frame>
            </div>
          </Match>

          <Match when={tab() === 'patch'}>
            <DataPatchEditor class={styles.patchEditor} />
          </Match>

          <Match when={tab() === 'settings'}>
            <SettingsEditor class={styles.patchEditor} />
          </Match>
        </Switch>
      </Frame>
    </Dialog>
  );
};

export { ContributingDialog };
export default ContributingDialog;

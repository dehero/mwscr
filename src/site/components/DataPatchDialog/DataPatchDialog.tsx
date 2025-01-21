import { writeClipboard } from '@solid-primitives/clipboard';
import type { UploadFile } from '@solid-primitives/upload';
import { createDropzone, createFileUploader } from '@solid-primitives/upload';
import JsFileDownloader from 'js-file-downloader';
import { createMemo, createSignal, Show } from 'solid-js';
import {
  dataPatchToString,
  getDataPatchFilename,
  getDataPatchName,
  stringToDataPatch,
} from '../../../core/entities/data-patch.js';
import { ANY_OPTION } from '../../../core/entities/option.js';
import { createIssueUrl } from '../../../core/github-issues/data-patch.js';
import { email } from '../../../core/services/email.js';
import { dataManager } from '../../data-managers/manager.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.jsx';
import {
  createDetachedDialogFragment,
  type DetachedDialog,
} from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Select } from '../Select/Select.jsx';
import type { TableRow } from '../Table/Table.jsx';
import { Table } from '../Table/Table.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './DataPatchDialog.module.css';

export const DataPatchDialog: DetachedDialog = (props) => {
  const { addToast, messageBox } = useToaster();

  const processUploadFiles = async (items: UploadFile[]) => {
    if (patchSize() > 0) {
      const result = await messageBox('Are you sure you want to merge selected patches into current patch?', [
        'Yes',
        'No',
      ]);
      if (result !== 0) {
        return;
      }
    }

    for (const item of items) {
      try {
        const data = stringToDataPatch(await item.file.text());
        dataManager.mergeLocalPatch(data);
        addToast(`Patch "${item.name}" imported`);
      } catch (error) {
        if (error instanceof Error) {
          addToast(`Failed to import patch: ${error.message}`);
          console.error(error.message);
        } else {
          addToast(`Failed to import patch: ${error}`);
        }
      }
    }
  };

  const { selectFiles } = createFileUploader({ accept: 'application/json', multiple: true });
  const { setRef: dropzoneRef } = createDropzone({ onDrop: processUploadFiles });

  const [rows, setRows] = createSignal<TableRow[]>([]);
  const [submitVariant, setSubmitVariant] = createSignal<'github-issue' | 'email'>('github-issue');

  const handleSubmit = () => {
    // submitButtonProps()?.onClick?.();
    // handleClose();
  };

  const handleExport = async () => {
    const patch = dataManager.getLocalPatch();
    const data = dataPatchToString(patch);
    const filename = getDataPatchFilename(patch);

    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const downloader = new JsFileDownloader({
      url: href,
      autoStart: false,
      nativeFallbackOnError: true,
      filename,
    });

    try {
      await downloader.start();
      addToast(`Patch "${filename}" exported`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      addToast(`Failed to export patch: ${message}`);
    }
  };

  const handleCopy = async () => {
    const patch = dataManager.getLocalPatch();
    const data = dataPatchToString(patch);

    writeClipboard(data);
    addToast('Patch copied to clipboard');
  };

  const handleImport = async () => {
    selectFiles(processUploadFiles);
  };

  const handleClear = async () => {
    const result = await messageBox('Are you sure you want to reset current patch?', ['Yes', 'No']);
    if (result === 0) {
      dataManager.clearLocalPatch();
    }
  };

  const handlePatchChange = () =>
    setRows([
      ...dataManager.postsManagers.map(
        (manager): TableRow => ({
          label: manager.descriptor.title,
          value: manager.localPatchSize,
          link:
            postsRoute.createUrl({ managerName: manager.name, status: ANY_OPTION.value }) +
            createDetachedDialogFragment('data-patch'),
        }),
      ),
      {
        label: 'Users',
        value: dataManager.users.localPatchSize,
        link: usersRoute.createUrl({ status: ANY_OPTION.value }) + createDetachedDialogFragment('data-patch'),
      },
    ]);

  const patchSize = useLocalPatch(handlePatchChange);

  const submitButtonProps = createMemo(() => {
    if (patchSize() === 0) {
      return undefined;
    }

    const action = submitVariant();
    switch (action) {
      case 'github-issue':
        return {
          href: createIssueUrl(dataManager.getLocalPatch()),
          target: '_blank',
        };
      case 'email': {
        const patch = dataManager.getLocalPatch();

        return {
          href: email.getUserMessagingUrl('dehero@outlook.com', {
            subject: getDataPatchName(patch),
            body: dataPatchToString(patch, true),
          }),
          target: '_blank',
        };
      }
      default:
        return undefined;
    }
  });

  return (
    <Dialog title="Local Patch" modal {...props} actions={[<Button onClick={props.onClose}>OK</Button>]}>
      <div class={styles.container}>
        <p class={styles.text}>
          Edit posts locally, then send all edits as a single patch. Use context menu to speed up.
        </p>

        <div class={styles.toolbar}>
          <Button onClick={handleImport}>Import</Button>
          <Button onClick={handleExport}>Export</Button>
          <Button onClick={handleCopy}>Copy</Button>
          <Button onClick={handleClear}>Reset</Button>
        </div>

        <Frame class={styles.tableWrapper} ref={dropzoneRef}>
          <Show when={patchSize() > 0} fallback={<span class={styles.fallback}>No patch</span>}>
            <Table label="Patch" value={patchSize()} rows={rows()} />
          </Show>
        </Frame>

        <div class={styles.toolbar}>
          <Select
            options={[
              { label: 'Create GitHub Issue', value: 'github-issue' },
              { label: 'Send via email', value: 'email' },
            ]}
            value={submitVariant()}
            onChange={setSubmitVariant}
            class={styles.submitVariant}
          />

          <Button {...submitButtonProps()} onClick={handleSubmit}>
            Send
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

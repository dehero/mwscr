import type { UploadFile } from '@solid-primitives/upload';
import { createDropzone, createFileUploader } from '@solid-primitives/upload';
import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { dataPatchToString, getDataPatchName } from '../../../core/entities/data-patch.js';
import { ANY_OPTION, ORIGINAL_OPTION } from '../../../core/entities/option.js';
import { dataPatchIssue } from '../../../core/github-issues/data-patch-issue.js';
import { email } from '../../../core/services/email.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { getResourceDataUrl } from '../../data-managers/resources.js';
import { uploadFiles } from '../../data-managers/uploads.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { postsRoute } from '../../routes/posts-route.js';
import { usersRoute } from '../../routes/users-route.js';
import { Button } from '../Button/Button.jsx';
import { DataPatchTooltip } from '../DataPatchTooltip/DataPatchTooltip.jsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Input } from '../Input/Input.jsx';
import { OptionSelectDialog } from '../OptionSelectDialog/OptionSelectDialog.jsx';
import { usePatchManager } from '../PatchManager/PatchManager.jsx';
// import { Select } from '../Select/Select.jsx';
import type { TableRow } from '../Table/Table.jsx';
import { Table } from '../Table/Table.jsx';
import { useToaster } from '../Toaster/Toaster.jsx';
import styles from './DataPatchEditor.module.css';

export interface DataPatchEditorProps {
  class?: string;
}

export const DataPatchEditor: Component<DataPatchEditorProps> = (props) => {
  const { addToast } = useToaster();
  const [showLoadDialog, setShowLoadDialog] = createSignal(false);

  const {
    saveLocalPatch,
    selectedPatch,
    loadPatch,
    patches,
    clearLocalPatch,
    exportLocalPatch,
    importLocalPatch,
    copyLocalPatch,
  } = usePatchManager();

  const processUploadFiles = async (items: UploadFile[]) => {
    await importLocalPatch(items.map((item) => item.file));
  };

  const { selectFiles } = createFileUploader({ accept: 'application/json', multiple: true });
  const { setRef: dropzoneRef } = createDropzone({ onDrop: processUploadFiles });

  const [rows, setRows] = createSignal<TableRow[]>([]);
  const [submitVariant, _setSubmitVariant] = createSignal<'github-issue' | 'email'>('github-issue');

  const handleSubmit = async () => {
    if (patchSize() === 0) {
      addToast('No edits to send.');
      return;
    }

    const patch = dataManager.getPatch();
    const data = dataPatchToString(patch, true);
    const filename = getDataPatchName(patch);

    if (!filename) {
      addToast('No edits to send.');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], filename);
    const result = await uploadFiles([file]);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        addToast(error);
      }

      return;
    }

    const upload = result.uploads[0];
    if (!upload) {
      addToast('Unknown error while uploading edits.');
      return;
    }

    let url;

    const action = submitVariant();
    switch (action) {
      case 'github-issue':
        url = dataPatchIssue.createIssueUrl(url);
        break;
      case 'email':
        url = email.getUserMessagingUrl('me@dehero.site', { subject: filename, body: getResourceDataUrl(upload.url) });
        break;
      default:
        return undefined;
    }

    window.open(url, '_blank');

    // submitButtonProps()?.onClick?.();
    // handleClose();
  };

  const handleImport = async () => {
    selectFiles(processUploadFiles);
  };

  const handleLoad = () => {
    setShowLoadDialog(true);
  };

  const handleLoadConfirm = async (name: string | undefined) => {
    setShowLoadDialog(false);
    if (name) {
      await loadPatch(name);
    } else {
      await clearLocalPatch();
    }
  };

  const handlePatchChange = () =>
    setRows([
      ...dataManager.postsManagers.map(
        (manager): TableRow => ({
          label: manager.descriptor.title,
          value: manager.patchSize,
          link:
            postsRoute.createUrl({ managerName: manager.name, status: ANY_OPTION.value }) +
            createDetachedDialogFragment('contributing', 'patch'),
        }),
      ),
      {
        label: 'Members',
        value: dataManager.users.patchSize,
        link:
          usersRoute.createUrl({ status: ANY_OPTION.value }) + createDetachedDialogFragment('contributing', 'patch'),
      },
    ]);

  const handleShare = async () => {
    if (patchSize() === 0) {
      addToast('No edits to share.');
      return;
    }

    if (!selectedPatch()) {
      addToast('Save local edits before sharing!');
      return;
    }

    handleSubmit();
  };

  const [patchSize, patchName] = useLocalPatch(handlePatchChange);

  return (
    <>
      <div class={clsx(styles.container, props.class)}>
        <Button onClick={handleLoad}>
          {selectedPatch()
            ? stripCommonExtension(selectedPatch()!.originalName)
            : patchSize() > 0
              ? 'Local Edits*'
              : ORIGINAL_OPTION.label}
        </Button>

        <Frame class={styles.selectedPatchWrapper}>
          <Show
            when={selectedPatch()}
            fallback={
              <span class={styles.fallback}>
                Make local edits, like creating drafts, then save them as a single patch. Share your patch to project
                administrator when you are done.
              </span>
            }
          >
            <Table
              rows={[
                {
                  label: 'Size',
                  value: `${selectedPatch()!.size}B`,
                },
                {
                  label: 'Uploaded',
                  value: `${formatDate(selectedPatch()!.uploaded)}, ${formatTime(selectedPatch()!.uploaded, true)}`,
                },
                {
                  label: 'Expires',
                  value: `${formatDate(selectedPatch()!.expires)}, ${formatTime(selectedPatch()!.expires, true)}`,
                },
              ]}
            />
          </Show>
        </Frame>

        <div class={styles.toolbar}>
          <Button onClick={handleImport}>Import</Button>
          <Button onClick={exportLocalPatch}>Export</Button>
          <Button onClick={copyLocalPatch}>Copy</Button>
          <Button onClick={clearLocalPatch}>Reset</Button>
        </div>

        <Frame class={styles.tableWrapper} ref={dropzoneRef}>
          <Show when={patchSize() > 0} fallback={<span class={styles.fallback}>No edits</span>}>
            <Table label="Edits" value={patchSize()} rows={rows()} />
          </Show>
        </Frame>

        <div class={styles.share}>
          <Input value={patchSize() > 0 ? `${patchName()}${!selectedPatch() ? '*' : ''}` : ''} />

          <Button onClick={saveLocalPatch}>Save</Button>
          <Button onClick={handleShare}>Share</Button>
        </div>

        {/* <Select
          options={[
            { label: 'Create GitHub Issue', value: 'github-issue' },
            { label: 'Send via email', value: 'email' },
          ]}
          value={submitVariant()}
          onChange={setSubmitVariant}
          class={styles.submitVariant}
        /> */}
      </div>

      <OptionSelectDialog
        title="Select Patch"
        show={showLoadDialog()}
        onClose={() => setShowLoadDialog(false)}
        onConfirm={handleLoadConfirm}
        options={[
          ORIGINAL_OPTION,
          ...[...(patches() ?? [])].map(([value, patch]) => ({
            label: stripCommonExtension(patch.originalName),
            value,
          })),
        ]}
        value={patchName()}
        optionTooltip={(value, forRef) => {
          if (!value) {
            return;
          }

          const patch = patches()?.get(value);
          if (!patch) {
            return;
          }

          return <DataPatchTooltip patch={patch} forRef={forRef} />;
        }}
      />
    </>
  );
};

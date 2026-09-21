// import { writeClipboard } from '@solid-primitives/clipboard';
import type { UploadFile } from '@solid-primitives/upload';
import { createDropzone, createFileUploader } from '@solid-primitives/upload';
import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { ANY_OPTION, ORIGINAL_OPTION } from '../../../core/entities/option.ts';
import { site } from '../../../core/services/site.ts';
import { formatDate, formatTime } from '../../../core/utils/date-utils.ts';
import { stripCommonExtension } from '../../../core/utils/string-utils.ts';
import { dataManager } from '../../data-managers/manager.ts';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { postsRoute } from '../../routes/posts-route.ts';
import { usersRoute } from '../../routes/users-route.ts';
import { texts } from '../../texts/index.ts';
import { currentLocale, localize } from '../../utils/intl-utils.ts';
import { Button } from '../Button/Button.tsx';
import { useDataPatchManager } from '../DataPatchManager/DataPatchManager.tsx';
import { DataPatchTooltip } from '../DataPatchTooltip/DataPatchTooltip.tsx';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.tsx';
import { Frame } from '../Frame/Frame.tsx';
// import { Input } from '../Input/Input.tsx';
import { OptionSelectDialog } from '../OptionSelectDialog/OptionSelectDialog.tsx';
import type { TableRow } from '../Table/Table.tsx';
import { Table } from '../Table/Table.tsx';
import { useToaster } from '../Toaster/Toaster.tsx';
import styles from './DataPatchEditor.module.css';

export interface DataPatchEditorProps {
  class?: string;
  patchName?: string;
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
    submitSelectedPatch,
    sharePatch,
  } = useDataPatchManager();

  const processUploadFiles = async (items: UploadFile[]) => {
    await importLocalPatch(items.map((item) => item.file));
  };

  const { selectFiles } = createFileUploader({ accept: 'application/json', multiple: true });
  const { setRef: dropzoneRef } = createDropzone({ onDrop: processUploadFiles });

  const [rows, setRows] = createSignal<TableRow[]>([]);

  const handleImport = async () => {
    selectFiles(processUploadFiles);
  };

  const handleLoad = () => {
    setShowLoadDialog(true);
  };

  const handleLoadConfirm = (name: string | undefined) => {
    setShowLoadDialog(false);
    if (name) {
      loadPatch(name, true);
    } else {
      clearLocalPatch();
    }
  };

  const handlePatchChange = () =>
    setRows([
      ...dataManager.postsManagers.map(
        (manager): TableRow => ({
          label: localize(manager.descriptor.title),
          value: manager.patchSize,
          link:
            postsRoute.createUrl({ managerName: manager.name, status: ANY_OPTION.value }) +
            createDetachedDialogFragment('contributing', 'patch'),
        }),
      ),
      {
        label: localize(texts.user.users),
        value: dataManager.users.patchSize,
        link:
          usersRoute.createUrl({ status: ANY_OPTION.value }) + createDetachedDialogFragment('contributing', 'patch'),
      },
    ]);

  const handleShare = async (e: Event) => {
    e.preventDefault();

    if (localPatchSize() === 0) {
      addToast(localize(texts.editing.noEditsToShare));
      return;
    }

    if (!selectedPatch() && !(await saveLocalPatch())) {
      return;
    }

    sharePatch(selectedPatch()!);
  };

  // const handleCopyName = async () => {
  //   const name = localPatchName();
  //   if (!name) {
  //     addToast('No name to copy.');
  //     return;
  //   }

  //   writeClipboard(name);
  //   addToast('Patch name copied to clipboard');
  // };

  const [localPatchSize, localPatchName] = useLocalPatch(handlePatchChange);

  return (
    <>
      <div class={clsx(styles.container, props.class)}>
        <Button onClick={handleLoad}>
          {selectedPatch()
            ? stripCommonExtension(selectedPatch()!.originalName)
            : localPatchSize() > 0
              ? `${localize(texts.editing.localEdits)}*`
              : localize(ORIGINAL_OPTION.label)}
        </Button>

        <Frame class={styles.selectedPatchWrapper}>
          <Show
            when={selectedPatch()}
            fallback={<span class={styles.fallback}>{localize(texts.editing.localEditsHint)}</span>}
          >
            <Table
              rows={[
                {
                  label: localize(texts.editing.size),
                  value: `${selectedPatch()!.size}B`,
                },
                {
                  label: localize(texts.editing.uploaded),
                  value: `${formatDate(selectedPatch()!.uploaded, currentLocale())}, ${formatTime(
                    selectedPatch()!.uploaded,
                    true,
                    currentLocale(),
                  )}`,
                },
                {
                  label: localize(texts.editing.expires),
                  value: `${formatDate(selectedPatch()!.expires, currentLocale())}, ${formatTime(
                    selectedPatch()!.expires,
                    true,
                    currentLocale(),
                  )}`,
                },
              ]}
            />
          </Show>
        </Frame>

        <div class={styles.toolbar}>
          <Button onClick={handleImport}>{localize(texts.editing.import)}</Button>
          <Button onClick={exportLocalPatch}>{localize(texts.editing.export)}</Button>
          <Button onClick={copyLocalPatch}>{localize(texts.common.copy)}</Button>
          <Button onClick={() => clearLocalPatch()}>{localize(texts.component.reset)}</Button>
        </div>

        <Frame class={styles.tableWrapper} ref={dropzoneRef}>
          <Show
            when={localPatchSize() > 0}
            fallback={<span class={styles.fallback}>{localize(texts.editing.noEdits)}</span>}
          >
            <Table label={localize(texts.editing.edits)} value={localPatchSize()} rows={rows()} />
          </Show>
        </Frame>

        {/* <div class={styles.name}>
          <Input value={localPatchSize() > 0 ? `${localPatchName()}${!selectedPatch() ? '*' : ''}` : ''} readonly />

          <Button onClick={handleCopyName}>Copy</Button>
        </div> */}

        <div class={styles.toolbar}>
          <Button onClick={saveLocalPatch}>{localize(texts.editing.save)}</Button>
          <Button
            onClick={handleShare}
            href={selectedPatch() ? site.getDataPatchSharingUrl(selectedPatch()!) : undefined}
            target="_blank"
          >
            {localize(texts.editing.share)}
          </Button>
          <Button onClick={submitSelectedPatch}>{localize(texts.editing.submit)}</Button>
        </div>
      </div>

      <OptionSelectDialog
        title={localize(texts.editing.patchSelection)}
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
        value={localPatchName()}
        optionTooltip={(value, forRef) => {
          const patch = value ? patches()?.get(value) : undefined;

          return <DataPatchTooltip patch={patch} forRef={forRef} />;
        }}
      />
    </>
  );
};

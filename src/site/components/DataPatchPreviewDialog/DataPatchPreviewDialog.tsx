import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import type { DataPatch } from '../../../core/entities/data-patch.js';
import type { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { Button } from '../Button/Button.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Divider } from '../Divider/Divider.jsx';
import { Frame } from '../Frame/Frame.jsx';
import type { TableRow } from '../Table/Table.jsx';
import { Table } from '../Table/Table.jsx';
import styles from './DataPatchPreviewDialog.module.css';

interface DataPatchPreviewDialogProps extends Omit<DialogProps, 'title' | 'modal' | 'contentClass' | 'actions'> {
  meta: Upload;
  patch: DataPatch;
  onApply: () => void;
}

export const DataPatchPreviewDialog: Component<DataPatchPreviewDialogProps> = (props) => {
  const edits = createMemo(() => {
    const patch = props.patch;

    return [
      ...dataManager.postsManagers.map(
        (manager): TableRow => ({
          label: manager.descriptor.title,
          value: Object.keys(patch[manager.name] ?? {}).length,
        }),
      ),
      {
        label: 'Members',
        value: Object.keys(patch.users ?? {}).length,
      },
    ];
  });

  const totalEdits = createMemo(() => edits().reduce((acc, row) => acc + Number(row.value), 0));

  return (
    <Dialog
      {...props}
      title="Apply Patch"
      actions={[<Button onClick={props.onApply}>Apply</Button>, <Button onClick={props.onClose}>Cancel</Button>]}
      modal
      contentClass={styles.container}
    >
      <p class={styles.title}>{stripCommonExtension(props.meta.originalName)}</p>
      <Frame class={styles.wrapper}>
        <Table
          rows={[
            {
              label: 'Size',
              value: `${props.meta.size}B`,
            },
            {
              label: 'Uploaded',
              value: `${formatDate(props.meta.uploaded)}, ${formatTime(props.meta.uploaded, true)}`,
            },
            {
              label: 'Expires',
              value: `${formatDate(props.meta.expires)}, ${formatTime(props.meta.expires, true)}`,
            },
          ]}
        />
        <Divider />
        <Table label="Edits" value={totalEdits()} rows={edits()} />
      </Frame>
    </Dialog>
  );
};

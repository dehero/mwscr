import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import type { DataPatch } from '../../../core/entities/data-patch.js';
import type { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { dataManager } from '../../data-managers/manager.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localize } from '../../utils/intl-utils.js';
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

const DataPatchPreviewDialog: Component<DataPatchPreviewDialogProps> = (props) => {
  const edits = createMemo(() => {
    const patch = props.patch;

    return [
      ...dataManager.postsManagers.map(
        (manager): TableRow => ({
          label: localize(manager.descriptor.title),
          value: Object.keys(patch[manager.name] ?? {}).length,
        }),
      ),
      {
        label: localize(texts.user.users),
        value: Object.keys(patch.users ?? {}).length,
      },
    ];
  });

  const totalEdits = createMemo(() => edits().reduce((acc, row) => acc + Number(row.value), 0));

  return (
    <Dialog
      {...props}
      title={localize(texts.editing.applyPatch)}
      actions={[
        <Button onClick={props.onApply}>{localize(texts.editing.apply)}</Button>,
        <Button onClick={props.onClose}>{localize(texts.common.cancel)}</Button>,
      ]}
      modal
      contentClass={styles.container}
    >
      <p class={styles.title}>{stripCommonExtension(props.meta.originalName)}</p>
      <Frame class={styles.wrapper}>
        <Table
          rows={[
            {
              label: localize(texts.editing.size),
              value: `${props.meta.size}B`,
            },
            {
              label: localize(texts.editing.uploaded),
              value: `${formatDate(props.meta.uploaded, currentLocale())}, ${formatTime(
                props.meta.uploaded,
                true,
                currentLocale(),
              )}`,
            },
            {
              label: localize(texts.editing.expires),
              value: `${formatDate(props.meta.expires, currentLocale())}, ${formatTime(
                props.meta.expires,
                true,
                currentLocale(),
              )}`,
            },
          ]}
        />
        <Divider />
        <Table label={localize(texts.editing.edits)} value={totalEdits()} rows={edits()} />
      </Frame>
    </Dialog>
  );
};

export { DataPatchPreviewDialog };
export default DataPatchPreviewDialog;

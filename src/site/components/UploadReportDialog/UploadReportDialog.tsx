import type { Component } from 'solid-js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import { createPostPath } from '../../../core/entities/posts-manager.js';
import { texts } from '../../texts/index.js';
import { localize } from '../../utils/intl-utils.js';
import { Button } from '../Button/Button.js';
import { createDetachedDialogFragment } from '../DetachedDialogsProvider/DetachedDialogsProvider.jsx';
import { Dialog } from '../Dialog/Dialog.js';
import { Frame } from '../Frame/Frame.jsx';
import { PostTooltip } from '../PostTooltip/PostTooltip.jsx';
import { ProgressBar } from '../ProgressBar/ProgressBar.jsx';
import { Table } from '../Table/Table.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import styles from './UploadReportDialog.module.css';

export interface UploadReportItem {
  name: string;
  status?: 'Uploading' | 'Uploaded' | 'Error';
  postInfo?: PostInfo;
  errors: string[];
}

export interface UploadReportDialogProps {
  show: boolean;
  onClose: () => void;
  uploadReport: UploadReportItem[];
}

const uploadStatusTexts = {
  Uploading: texts.editing.uploading,
  Uploaded: texts.editing.uploaded,
  Error: texts.editing.uploadError,
} satisfies Record<NonNullable<UploadReportItem['status']>, typeof texts.editing.uploading>;

export const UploadReportDialog: Component<UploadReportDialogProps> = (props) => {
  const processedUploadsCount = () => props.uploadReport.reduce((acc, item) => acc + (item.status ? 1 : 0), 0);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      modal
      actions={
        <Button onClick={props.onClose}>
          {processedUploadsCount() < props.uploadReport.length
            ? localize(texts.editing.stopUploading)
            : localize(texts.common.ok)}
        </Button>
      }
    >
      <p class={styles.progressText}>
        {localize(texts.editing.processedFiles, {
          processed: processedUploadsCount(),
          total: props.uploadReport.length,
        })}
      </p>

      <ProgressBar value={processedUploadsCount()} maximum={props.uploadReport.length} class={styles.progressBar} />

      <Frame class={styles.uploadReport}>
        <Table
          label={localize(texts.editing.file)}
          value={localize(texts.editing.status)}
          class={styles.progressTable}
          rows={props.uploadReport.map((item) => ({
            label: item.name,
            value: item.status ? localize(uploadStatusTexts[item.status]) : localize(texts.editing.pending),
            tooltip: (forRef) =>
              item.postInfo ? (
                <PostTooltip postInfo={item.postInfo} forRef={forRef} />
              ) : item.errors.length > 0 ? (
                <Tooltip class={styles.uploadTooltip} forRef={forRef}>
                  {item.errors.join('\n\n')}
                </Tooltip>
              ) : undefined,
            link: item.postInfo
              ? createDetachedDialogFragment(
                  'post-editing',
                  createPostPath(item.postInfo.managerName, item.postInfo.id),
                )
              : undefined,
          }))}
          showEmptyValueRows
          shrink="label"
        />
      </Frame>
    </Dialog>
  );
};

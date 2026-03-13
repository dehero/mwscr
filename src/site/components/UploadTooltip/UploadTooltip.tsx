import { type Component, splitProps } from 'solid-js';
import type { TooltipProps } from '../Tooltip/Tooltip.js';
import { Tooltip } from '../Tooltip/Tooltip.js';
import styles from './UploadTooltip.module.css';
import { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { Divider } from '../Divider/Divider.jsx';

interface UploadTooltipProps extends Omit<TooltipProps, 'children'> {
  upload: Upload;
}

export const UploadTooltip: Component<UploadTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['upload']);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.upload.originalName}</span>
      <span>MIME Type: {local.upload.mime}</span>
      <span>Type: {local.upload.type}</span>
      <span>Size: {local.upload.size}B</span>
      <span>
        Uploaded: {formatDate(local.upload.uploaded)}, {formatTime(local.upload.uploaded, true)}
      </span>
      <span>
        Expires: {formatDate(local.upload.expires)}, {formatTime(local.upload.expires, true)}
      </span>
      <Divider class={styles.divider} />
      <span>{local.upload.name}</span>
    </Tooltip>
  );
};

import { type Component, splitProps } from 'solid-js';
import type { TooltipProps } from '../Tooltip/Tooltip.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import styles from './DataPatchTooltip.module.css';
import { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { Divider } from '../Divider/Divider.jsx';

interface DataPatchTooltipProps extends Omit<TooltipProps, 'children'> {
  patch: Upload;
}

export const DataPatchTooltip: Component<DataPatchTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['patch']);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{stripCommonExtension(local.patch.originalName)}</span>
      <span>Size: {local.patch.size}B</span>
      <span>
        Uploaded: {formatDate(local.patch.uploaded)}, {formatTime(local.patch.uploaded, true)}
      </span>
      <span>
        Expires: {formatDate(local.patch.expires)}, {formatTime(local.patch.expires, true)}
      </span>
      <Divider class={styles.divider} />
      <span>{local.patch.name}</span>
    </Tooltip>
  );
};

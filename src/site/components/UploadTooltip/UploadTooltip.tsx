import { type Component, splitProps } from 'solid-js';
import type { Upload } from '../../../core/entities/upload.ts';
import { formatDate, formatTime } from '../../../core/utils/date-utils.ts';
import { texts } from '../../texts/index.ts';
import { currentLocale, localize } from '../../utils/intl-utils.ts';
import { Divider } from '../Divider/Divider.tsx';
import type { TooltipProps } from '../Tooltip/Tooltip.tsx';
import { Tooltip } from '../Tooltip/Tooltip.tsx';
import styles from './UploadTooltip.module.css';

interface UploadTooltipProps extends Omit<TooltipProps, 'children'> {
  upload: Upload;
}

export const UploadTooltip: Component<UploadTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['upload']);

  return (
    <Tooltip {...rest}>
      <span class={styles.title}>{local.upload.originalName}</span>
      <span>
        {localize(texts.editing.mimeType)}: {local.upload.mime}
      </span>
      <span>
        {localize(texts.editing.fileType)}: {local.upload.type}
      </span>
      <span>
        {localize(texts.editing.size)}: {local.upload.size}B
      </span>
      <span>
        {localize(texts.editing.uploaded)}: {formatDate(local.upload.uploaded, currentLocale())},{' '}
        {formatTime(local.upload.uploaded, true, currentLocale())}
      </span>
      <span>
        {localize(texts.editing.expires)}: {formatDate(local.upload.expires, currentLocale())},{' '}
        {formatTime(local.upload.expires, true, currentLocale())}
      </span>
      <Divider class={styles.divider} />
      <span>{local.upload.name}</span>
    </Tooltip>
  );
};

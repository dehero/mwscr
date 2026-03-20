import { type Component, Show, splitProps } from 'solid-js';
import type { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { Divider } from '../Divider/Divider.jsx';
import type { TooltipProps } from '../Tooltip/Tooltip.jsx';
import { Tooltip } from '../Tooltip/Tooltip.jsx';
import styles from './DataPatchTooltip.module.css';

interface DataPatchTooltipProps extends Omit<TooltipProps, 'children'> {
  patch: Upload | undefined;
}

export const DataPatchTooltip: Component<DataPatchTooltipProps> = (props) => {
  const [local, rest] = splitProps(props, ['patch']);

  return (
    <Tooltip {...rest}>
      <Show when={local.patch} fallback={'No patch'}>
        {(patch) => (
          <>
            <span class={styles.title}>{stripCommonExtension(patch().originalName)}</span>
            <span>Size: {patch().size}B</span>
            <span>
              Uploaded: {formatDate(patch().uploaded)}, {formatTime(patch().uploaded, true)}
            </span>
            <span>
              Expires: {formatDate(patch().expires)}, {formatTime(patch().expires, true)}
            </span>
            <Divider class={styles.divider} />
            <span>{patch().name}</span>
          </>
        )}
      </Show>
    </Tooltip>
  );
};

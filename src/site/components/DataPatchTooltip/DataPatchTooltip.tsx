import { type Component, Show, splitProps } from 'solid-js';
import type { Upload } from '../../../core/entities/upload.js';
import { formatDate, formatTime } from '../../../core/utils/date-utils.js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { texts } from '../../texts/index.js';
import { currentLocale, localize } from '../../utils/intl-utils.js';
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
      <Show when={local.patch} fallback={localize(texts.editing.noPatch)}>
        {(patch) => (
          <>
            <span class={styles.title}>{stripCommonExtension(patch().originalName)}</span>
            <span>
              {localize(texts.editing.size)}: {patch().size}B
            </span>
            <span>
              {localize(texts.editing.uploaded)}: {formatDate(patch().uploaded, currentLocale())},{' '}
              {formatTime(patch().uploaded, true, currentLocale())}
            </span>
            <span>
              {localize(texts.editing.expires)}: {formatDate(patch().expires, currentLocale())},{' '}
              {formatTime(patch().expires, true, currentLocale())}
            </span>
            <Divider class={styles.divider} />
            <span>{patch().name}</span>
          </>
        )}
      </Show>
    </Tooltip>
  );
};

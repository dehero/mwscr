import { createMemo } from 'solid-js';
import { stripCommonExtension } from '../../../core/utils/string-utils.js';
import { useLocalPatch } from '../../hooks/useLocalPatch.js';
import { usePatchManager } from '../PatchManager/PatchManager.jsx';
import { Select } from '../Select/Select.jsx';
import styles from './DataPatchSelect.module.css';
import { EMPTY_OPTION } from '../../../core/entities/option.js';

export const DataPatchSelect = () => {
  const [patchSize, patchName] = useLocalPatch();
  const { patches, selectedPatch, loadPatch, clearLocalPatch } = usePatchManager();

  const handleChange = (value: string | undefined) => {
    if (value) {
      loadPatch(value);
    } else {
      clearLocalPatch();
    }
  };

  const options = createMemo(() => {
    return [
      EMPTY_OPTION,
      ...(!selectedPatch() && patchSize() > 0
        ? [
            {
              label: 'Local Edits*',
              value: patchName(),
            },
          ]
        : []),
      ...[...(patches() ?? [])].map(([value, patch]) => ({ label: stripCommonExtension(patch.originalName), value })),
    ];
  });

  return <Select options={options()} value={patchName()} class={styles.uploads} onChange={handleChange} />;
};

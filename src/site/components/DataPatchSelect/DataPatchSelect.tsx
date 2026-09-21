import clsx from 'clsx';
import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import { ORIGINAL_OPTION } from '../../../core/entities/option.ts';
import { stripCommonExtension } from '../../../core/utils/string-utils.ts';
import { useLocalPatch } from '../../hooks/useLocalPatch.ts';
import { useDataPatchManager } from '../DataPatchManager/DataPatchManager.tsx';
import { DataPatchTooltip } from '../DataPatchTooltip/DataPatchTooltip.tsx';
import { Select } from '../Select/Select.tsx';
import styles from './DataPatchSelect.module.css';

interface DataPatchSelectProps {
  class?: string;
}

export const DataPatchSelect: Component<DataPatchSelectProps> = (props) => {
  const [patchSize, patchName] = useLocalPatch();
  const { patches, selectedPatch, loadPatch, clearLocalPatch } = useDataPatchManager();

  let selectRef;

  const handleChange = (value: string | undefined) => {
    if (value) {
      loadPatch(value);
    } else {
      clearLocalPatch();
    }
  };

  const options = createMemo(() => {
    return [
      ORIGINAL_OPTION,
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

  return (
    <>
      <Select
        options={options()}
        value={patchName()}
        class={clsx(props.class, styles.uploads)}
        onChange={handleChange}
        ref={selectRef}
      />

      <DataPatchTooltip patch={selectedPatch()} forRef={selectRef} />
    </>
  );
};

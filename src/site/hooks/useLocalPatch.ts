import type { Accessor } from 'solid-js';
import { batch, createEffect, createSignal, onCleanup } from 'solid-js';
import { dataManager } from '../data-managers/manager.js';

export function useLocalPatch(
  onPatchChange?: (patchSize: number, patchName: string | undefined) => void,
): [patchSize: Accessor<number>, patchName: Accessor<string | undefined>] {
  const [patchSize, setPatchSize] = createSignal(0);
  const [patchName, setPatchName] = createSignal<string>();

  const handlePatchChange = () => {
    const patchSize = dataManager.patchSize;
    const patchName = dataManager.patchName;

    batch(() => {
      setPatchSize(patchSize);
      setPatchName(patchName);
    });

    onPatchChange?.(patchSize, patchName);
  };

  createEffect(() => {
    window.addEventListener('storage', handlePatchChange);

    handlePatchChange();

    onCleanup(() => window.removeEventListener('storage', handlePatchChange));
  });

  return [patchSize, patchName];
}

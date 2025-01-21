import { createEffect, createSignal, onCleanup } from 'solid-js';
import { dataManager } from '../data-managers/manager.js';

export function useLocalPatch(onPatchChange?: (patchSize: number) => void) {
  const [patchSize, setPatchSize] = createSignal(0);

  const handlePatchChange = () => {
    const patchSize = dataManager.localPatchSize;
    setPatchSize(patchSize);
    onPatchChange?.(patchSize);
  };

  createEffect(() => {
    window.addEventListener('storage', handlePatchChange);

    handlePatchChange();

    onCleanup(() => window.removeEventListener('storage', handlePatchChange));
  });

  return patchSize;
}

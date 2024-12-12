import type { Accessor } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';

export function useHash(): [Accessor<string>, (value: string) => void] {
  const [hash, setHash] = createSignal('');

  createEffect(() => {
    const callback = () => setHash(window.location.hash);
    window.addEventListener('hashchange', callback);
    onCleanup(() => window.removeEventListener('hashchange', callback));
  });

  const setWindowHash = (value: string) => {
    window.location.hash = value;
  };

  return [hash, setWindowHash];
}

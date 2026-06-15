import { useLocation } from '@solidjs/router';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';

export function useHash(): [Accessor<string>, (value: string) => void] {
  const [hash, setHash] = createSignal('');
  const location = useLocation();

  createEffect(() => setHash(location.hash));

  const setWindowHash = (value: string) => {
    window.location.hash = value;
  };

  return [hash, setWindowHash];
}

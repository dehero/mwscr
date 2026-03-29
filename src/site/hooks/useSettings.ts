import { createEffect, createSignal, onCleanup } from 'solid-js';
import { siteStore } from '../stores/index.js';

export function useSettings(onChange?: (secretKey: string | undefined) => void) {
  const [secretKey, setSecretKey] = createSignal<string>();

  const handleChange = async () => {
    const secretKey = siteStore.getSecretKey();

    setSecretKey(secretKey);

    requestAnimationFrame(() => onChange?.(secretKey));
  };

  createEffect(() => {
    window.addEventListener('storage', handleChange);

    handleChange();

    onCleanup(() => window.removeEventListener('storage', handleChange));
  });

  return { secretKey };
}

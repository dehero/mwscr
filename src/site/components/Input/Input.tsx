import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import { type Component, createEffect, createSignal, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Input.module.css';

interface InputProps {
  class?: string;
  name?: string;
  label?: string;
  vertical?: boolean;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  value?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [localValue, setLocalValue] = createSignal<string>('');

  const debouncedChange = debounce((value: string) => props.onDebouncedChange?.(value), 800);

  const handleInput = (value: string) => {
    setLocalValue(value);
    props.onChange?.(value);
    if (props.onDebouncedChange) {
      debouncedChange(value);
    }
  };

  createEffect(() => setLocalValue(props.value || ''));

  return (
    <label class={clsx(styles.container, props.vertical && styles.vertical, props.class)}>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      <Frame variant="thin">
        <input
          class={styles.input}
          name={props.name}
          onInput={(e) => handleInput(e.target.value)}
          value={localValue()}
        />
      </Frame>
    </label>
  );
};

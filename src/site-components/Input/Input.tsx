import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import { type Component, createSignal } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Input.module.css';

interface InputProps {
  class?: string;
  name?: string;
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

  return (
    <Frame component="label" variant="thin" class={clsx(styles.wrapper, props.class)}>
      <input
        class={styles.input}
        name={props.name}
        onInput={(e) => handleInput(e.target.value)}
        value={localValue() || ''}
      />
    </Frame>
  );
};

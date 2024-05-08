import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import { type Component, createEffect, createSignal, Show } from 'solid-js';
import frameStyles from '../Frame/Frame.module.css';
import styles from './Input.module.css';

interface InputProps {
  class?: string;
  name?: string;
  label?: string;
  vertical?: boolean;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  value?: string;
  multiline?: boolean;
  readonly?: boolean;
  rows?: number | string;
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
    <label class={clsx(styles.container, props.vertical && styles.vertical)}>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      <Show
        when={props.multiline}
        fallback={
          <input
            class={clsx(frameStyles.thin, styles.input, props.class)}
            name={props.name}
            onInput={(e) => handleInput(e.target.value)}
            value={localValue()}
            readonly={props.readonly}
          />
        }
      >
        <textarea
          class={clsx(frameStyles.thin, styles.input, props.class)}
          name={props.name}
          rows={props.rows}
          onInput={(e) => handleInput(e.target.value)}
          value={localValue()}
          readonly={props.readonly}
        />
      </Show>
    </label>
  );
};

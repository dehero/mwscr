import clsx from 'clsx';
import { For, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './RadioGroup.module.css';

interface RadioGroupOption<T> {
  value: T | undefined;
  label?: string;
}

interface RadioGroupProps<T> {
  class?: string;
  options: RadioGroupOption<T>[];
  name: string;
  label?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

export function RadioGroup<T extends string>(props: RadioGroupProps<T>) {
  return (
    <div class={clsx(styles.container, props.class)}>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      <For each={props.options}>
        {(option) => (
          <Frame component="label" variant="button" class={styles.option} tabIndex={0}>
            <input
              type="radio"
              value={option.value ?? ''}
              name={props.name}
              checked={props.value === option.value}
              onChange={(e) => props.onChange((e.target.value || undefined) as T | undefined)}
              class={styles.radio}
            />
            <span class={styles.label}>{option.label || option.value}</span>
          </Frame>
        )}
      </For>
    </div>
  );
}

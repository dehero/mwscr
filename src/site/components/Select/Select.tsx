import clsx from 'clsx';
import { For, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Select.module.css';

export interface SelectOption<T> {
  value: T | undefined;
  label?: string;
}

export interface SelectProps<T> {
  class?: string;
  options: SelectOption<T>[];
  name?: string;
  label?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

export function Select<T extends string>(props: SelectProps<T>) {
  return (
    <label class={clsx(styles.container)}>
      <Show when={props.label}>
        <span class={styles.label}>{props.label}</span>
      </Show>
      <Frame variant="thin" class={styles.wrapper}>
        <select
          class={clsx(styles.select, props.class)}
          name={props.name}
          onChange={(e) => props.onChange((e.currentTarget.value || undefined) as T | undefined)}
        >
          <For each={props.options}>
            {(option) => (
              <option value={option.value || ''} class={styles.option} selected={props.value === option.value}>
                {option.label || option.value}
              </option>
            )}
          </For>
        </select>
      </Frame>
    </label>
  );
}

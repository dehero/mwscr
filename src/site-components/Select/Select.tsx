import clsx from 'clsx';
import { For } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Select.module.css';

interface SelectOption<T> {
  value: T | undefined;
  label?: string;
}

interface SelectProps<T> {
  class?: string;
  options: SelectOption<T>[];
  name?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

export function Select<T extends string>(props: SelectProps<T>) {
  return (
    <Frame component="label" variant="thin" class={clsx(styles.wrapper, props.class)}>
      <select
        class={styles.select}
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
  );
}

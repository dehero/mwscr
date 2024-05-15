import clsx from 'clsx';
import { For } from 'solid-js';
import frameStyles from '../Frame/Frame.module.css';
import styles from './Select.module.css';

export interface SelectOption<T> {
  value: T | undefined;
  label?: string;
}

export interface SelectProps<T> {
  class?: string;
  options: SelectOption<T>[];
  name?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

export function Select<T extends string>(props: SelectProps<T>) {
  return (
    <select
      class={clsx(frameStyles.thin, styles.select, props.class)}
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
  );
}

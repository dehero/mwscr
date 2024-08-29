import clsx from 'clsx';
import type { JSX } from 'solid-js';
import { For } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { Frame } from '../Frame/Frame.js';
import styles from './Select.module.css';

export interface SelectProps<T> {
  class?: string;
  options: Option<T>[];
  name?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

export function Select<T extends string>(props: SelectProps<T>) {
  const handleChange: JSX.ChangeEventHandlerUnion<HTMLSelectElement, Event> = (e) => {
    props.onChange((e.currentTarget.value || undefined) as T | undefined);
    // Don't show new control value until it's changed with props.value
    e.currentTarget.value = (props.value || '') as string;
  };

  return (
    <Frame<'select'>
      component="select"
      class={clsx(styles.select, props.class)}
      name={props.name}
      onChange={handleChange}
    >
      <For each={props.options}>
        {(option) => (
          <option value={option.value || ''} class={styles.option} selected={props.value === option.value}>
            {option.label || option.value}
          </option>
        )}
      </For>
    </Frame>
  );
}

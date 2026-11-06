import clsx from 'clsx';
import type { JSX } from 'solid-js';
import { createMemo, For } from 'solid-js';
import type { Option } from '../../../core/entities/option.ts';
import type { IntlText } from '../../../core/entities/intl.ts';
import { localize } from '../../utils/intl-utils.ts';
import { Frame } from '../Frame/Frame.tsx';
import styles from './Select.module.css';

export interface SelectProps<T> {
  class?: string;
  options: Option<T>[];
  name?: string;
  onChange: (value: T | undefined) => void;
  value?: T | undefined;
}

interface SelectGroup<T> {
  label?: string | IntlText;
  options: Option<T>[];
}

export function Select<T extends string>(props: SelectProps<T>) {
  const handleChange: JSX.ChangeEventHandlerUnion<HTMLSelectElement, Event> = (e) => {
    props.onChange((e.currentTarget.value || undefined) as T | undefined);
    // Don't show new control value until it's changed with props.value
    e.currentTarget.value = (props.value || '') as string;
  };

  const renderOption = (option: Option<T>) => (
    <option value={option.value || ''} class={styles.option} selected={props.value === option.value}>
      {localize(option.label) || option.value?.toString() || ''}
    </option>
  );

  // Consecutive options sharing the same `group` are rendered inside an optgroup.
  const groups = createMemo(() => {
    const result: SelectGroup<T>[] = [];

    for (const option of props.options) {
      const last = result.at(-1);

      if (last && last.label === option.group) {
        last.options.push(option);
      } else {
        result.push({ label: option.group, options: [option] });
      }
    }

    return result;
  });

  return (
    <Frame<'select'>
      component="select"
      class={clsx(styles.select, props.class)}
      name={props.name}
      onChange={handleChange}
    >
      <For each={groups()}>
        {(group) => {
          const options = <For each={group.options}>{renderOption}</For>;

          return group.label ? (
            <optgroup class={styles.group} label={localize(group.label)}>
              {options}
            </optgroup>
          ) : (
            options
          );
        }}
      </For>
    </Frame>
  );
}

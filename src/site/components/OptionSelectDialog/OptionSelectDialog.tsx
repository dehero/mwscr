import type { JSX } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import { getSearchTokens, search } from '../../../core/utils/common-utils.js';
import { Button } from '../Button/Button.jsx';
import type { DialogProps } from '../Dialog/Dialog.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';
import { Frame } from '../Frame/Frame.jsx';
import { Input } from '../Input/Input.jsx';
import { Table } from '../Table/Table.jsx';
import styles from './OptionSelectDialog.module.css';

export interface OptionSelectDialogProps<T = string> extends Omit<DialogProps, 'modal' | 'actions' | 'contentClass'> {
  value: T | undefined;
  onConfirm: (value: T | undefined) => void;
  options: Option<T>[];
  optionTooltip?: (value: T | undefined, forRef: HTMLElement) => JSX.Element;
}

export function OptionSelectDialog<T>(props: OptionSelectDialogProps<T>) {
  const [wrapperRef, setWrapperRef] = createSignal<HTMLDivElement | undefined>();
  const [currentValue, setCurrentValue] = createSignal<T | undefined>();
  const [searchTerm, setSearchTerm] = createSignal<string>('');

  const handleConfirm = () => {
    props.onConfirm(currentValue());
  };

  createEffect(() => {
    setCurrentValue(() => props.value);
  });

  const options = () => {
    const tokens = getSearchTokens(searchTerm());
    return props.options.filter((option) => search(tokens, [option.label, `${option.value}`]));
  };

  return (
    <>
      <Dialog
        {...props}
        actions={[<Button onClick={handleConfirm}>OK</Button>, <Button onClick={props.onClose}>Cancel</Button>]}
        modal
        contentClass={styles.container}
      >
        <Input value={searchTerm()} onChange={setSearchTerm} class={styles.searchInput} />
        <Frame class={styles.optionsWrapper} ref={setWrapperRef}>
          <Table
            class={styles.options}
            scrollTarget={wrapperRef()}
            rows={options().map((option) => ({
              label: option.label,
              onClick: (e: Event) => {
                e.preventDefault();
                setCurrentValue(() => option.value);
              },
              selected: option.value === currentValue(),
              tooltip: props.optionTooltip
                ? (forRef: HTMLElement) => props.optionTooltip?.(option.value, forRef)
                : undefined,
            }))}
            showEmptyValueRows
          />
        </Frame>
      </Dialog>
    </>
  );
}

import type { JSX } from 'solid-js';
import { createMemo, createSignal } from 'solid-js';
import type { Option } from '../../../core/entities/option.js';
import type { ButtonProps } from '../Button/Button.jsx';
import { Button } from '../Button/Button.jsx';
import { OptionSelectDialog } from '../OptionSelectDialog/OptionSelectDialog.jsx';

export interface OptionSelectButtonProps<T> extends Omit<ButtonProps, 'title' | 'onChange'> {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: Option<T>[];
  title: string;
  emptyLabel?: string;
  optionTooltip?: (value: T | undefined, forRef: HTMLElement) => JSX.Element;
}

export function OptionSelectButton<T>(props: OptionSelectButtonProps<T>) {
  const selectedUserOption = createMemo(() => props.options.find((option) => option.value === props.value));

  const [showDialog, setShowDialog] = createSignal(false);

  const handleConfirm = (value: T | undefined) => {
    setShowDialog(false);
    props.onChange(value);
  };

  const buttonText = createMemo(() => {
    const selected = selectedUserOption();
    if (!selected && props.emptyLabel) return props.emptyLabel;
    return selected?.label ?? '';
  });

  return (
    <>
      <Button
        onClick={(e: Event) => {
          e.preventDefault();
          setShowDialog(true);
        }}
      >
        {buttonText()}
      </Button>
      <OptionSelectDialog
        title={props.title}
        show={showDialog()}
        value={props.value}
        options={props.options}
        onConfirm={handleConfirm}
        onClose={() => setShowDialog(false)}
        optionTooltip={props.optionTooltip}
      />
    </>
  );
}

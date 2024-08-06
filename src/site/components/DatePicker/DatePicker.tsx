import { createEffect, createSignal } from 'solid-js';
import type { DateRange } from '../../../core/utils/common-types.js';
import { dateToString, formatDate } from '../../../core/utils/date-utils.js';
import { Button } from '../Button/Button.jsx';
import { Calendar } from '../Calendar/Calendar.jsx';
import { Dialog } from '../Dialog/Dialog.jsx';

export interface DatePickerProps<
  TPeriod extends boolean | undefined,
  TValue = TPeriod extends undefined | false ? Date : DateRange,
> {
  class?: string;
  emptyLabel?: string;
  value?: TValue;
  onChange?: (value: TValue | undefined) => void;
  period: TPeriod;
}

export function DatePicker<TPeriod extends boolean | undefined>(props: DatePickerProps<TPeriod>) {
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [value, setValue] = createSignal<typeof props.value>(props.value);
  const label = () => {
    if (!props.value) {
      return props.emptyLabel || 'None';
    }

    if (Array.isArray(props.value)) {
      if (props.value[1] && dateToString(props.value[0]) !== dateToString(props.value[1])) {
        return `${formatDate(props.value[0])} — ${formatDate(props.value[1])}`;
      }
      return formatDate(props.value[0]);
    }

    return formatDate(props.value);
  };

  createEffect(() => {
    const value = props.value;
    setValue(() => value);
  });

  return (
    <>
      <Button
        class={props.class}
        onClick={(e: Event) => {
          e.preventDefault();
          setDialogOpen(true);
        }}
      >
        {label()}
      </Button>
      <Dialog
        actions={[
          <Button
            onClick={(e: Event) => {
              e.preventDefault();
              props.onChange?.(value());
              setDialogOpen(false);
            }}
          >
            Ok
          </Button>,
          <Button
            onClick={(e: Event) => {
              e.preventDefault();
              props.onChange?.(undefined);
              setDialogOpen(false);
            }}
          >
            Reset
          </Button>,
          <Button
            onClick={(e: Event) => {
              e.preventDefault();
              setDialogOpen(false);
            }}
          >
            Cancel
          </Button>,
        ]}
        show={dialogOpen()}
        onClose={() => setDialogOpen(false)}
      >
        <Calendar period={props.period} value={value()} onChange={setValue} />
      </Dialog>
    </>
  );
}

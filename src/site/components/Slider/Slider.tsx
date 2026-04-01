import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Slider.module.css';

export interface SliderProps {
  class?: string;
  name?: string;
  onChange?: (value: number) => void;
  onDebouncedChange?: (value: number) => void;
  onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  minLabel?: string;
  maxLabel?: string;
}

export const Slider: Component<SliderProps> = (props) => {
  let inputRef: HTMLInputElement | undefined;

  const getInitialValue = () => {
    if (props.value !== undefined && !Number.isNaN(props.value)) {
      return props.value;
    }
    if (props.min !== undefined) {
      return props.min;
    }
    return 0;
  };

  const [localValue, setLocalValue] = createSignal(getInitialValue());

  const debouncedChange = props.onDebouncedChange
    ? debounce((value: number) => props.onDebouncedChange?.(value), 800)
    : null;

  const handleInput = (value: number | string) => {
    let newValue: number;

    if (typeof value === 'string') {
      newValue = Number.parseFloat(value);
      if (Number.isNaN(newValue)) {
        return;
      }
    } else {
      newValue = value;
    }

    setLocalValue(newValue);
    props.onChange?.(newValue);
    debouncedChange?.(newValue);
  };

  createEffect(() => {
    if (props.value !== undefined && !Number.isNaN(props.value) && props.value !== localValue()) {
      setLocalValue(props.value);
    }
  });

  // Critical: Force sync after mount
  onMount(() => {
    if (inputRef && props.value !== undefined) {
      const valueStr = String(props.value);
      if (inputRef.value !== valueStr) {
        inputRef.value = valueStr;
        setLocalValue(props.value);
      }
    }
  });

  const decrement = () => {
    const step = props.step ?? 1;
    const newValue = localValue() - step;

    if (props.min === undefined || newValue >= props.min) {
      handleInput(newValue);
    }
  };

  const increment = () => {
    const step = props.step ?? 1;
    const newValue = localValue() + step;

    if (props.max === undefined || newValue <= props.max) {
      handleInput(newValue);
    }
  };

  const setupPressHold = (action: () => void) => {
    let timer: NodeJS.Timeout | null = null;
    let interval: NodeJS.Timeout | null = null;
    let isPressed = false;

    const stopPress = () => {
      if (!isPressed) return;

      isPressed = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('mouseup', stopPress);
        window.removeEventListener('touchend', stopPress);
        window.removeEventListener('touchcancel', stopPress);
      }
    };

    const startPress = () => {
      if (isPressed || props.disabled) return;

      isPressed = true;

      if (typeof window !== 'undefined') {
        window.addEventListener('mouseup', stopPress);
        window.addEventListener('touchend', stopPress);
        window.addEventListener('touchcancel', stopPress);
      }

      action();

      timer = setTimeout(() => {
        interval = setInterval(() => {
          if (isPressed && !props.disabled) {
            action();
          }
        }, 100);
      }, 400);
    };

    return { startPress, stopPress };
  };

  const decrementHold = setupPressHold(decrement);
  const incrementHold = setupPressHold(increment);

  onCleanup(() => {
    decrementHold.stopPress();
    incrementHold.stopPress();
  });

  return (
    <div class={clsx(styles.container, (props.minLabel || props.maxLabel) && styles.hasLabels, props.class)}>
      <Frame<'button'>
        component="button"
        class={styles.decrement}
        onMouseDown={decrementHold.startPress}
        onTouchStart={decrementHold.startPress}
        disabled={props.disabled}
        aria-label="Decrease value"
      >
        <Show when={props.minLabel}>
          <span class={styles.buttonLabel}>{props.minLabel}</span>
        </Show>
      </Frame>
      <Frame<'input'>
        ref={inputRef}
        component="input"
        type="range"
        class={styles.slider}
        name={props.name}
        value={localValue()}
        min={props.min}
        max={props.max}
        step={props.step}
        onInput={(e) => handleInput(e.currentTarget.value)}
        onBlur={props.onBlur}
        disabled={props.disabled}
      />
      <Frame<'button'>
        component="button"
        class={styles.increment}
        onMouseDown={incrementHold.startPress}
        onTouchStart={incrementHold.startPress}
        disabled={props.disabled}
        aria-label="Increase value"
      >
        <Show when={props.maxLabel}>
          <span class={styles.buttonLabel}>{props.maxLabel}</span>
        </Show>
      </Frame>
    </div>
  );
};

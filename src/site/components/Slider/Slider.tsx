import { debounce } from '@solid-primitives/scheduled';
import clsx from 'clsx';
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
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
  const [localValue, setLocalValue] = createSignal<number>(props.value || props.min || 0);

  const debouncedChange = debounce((value: number) => props.onDebouncedChange?.(value), 800);

  const handleInput = (value: number) => {
    setLocalValue(value);
    props.onChange?.(value);
    if (props.onDebouncedChange) {
      debouncedChange(value);
    }
  };

  // Sync local value with external value prop
  createEffect(() => setLocalValue(props.value || props.min || 0));

  const decrement = () => {
    const step = props.step ?? 1;
    const newValue = (localValue() || 0) - step;
    // Only update if within bounds, otherwise silently ignore
    if (props.min === undefined || newValue >= props.min) {
      handleInput(newValue);
    }
  };

  const increment = () => {
    const step = props.step ?? 1;
    const newValue = (localValue() || 0) + step;
    // Only update if within bounds, otherwise silently ignore
    if (props.max === undefined || newValue <= props.max) {
      handleInput(newValue);
    }
  };

  // Press and hold functionality for buttons
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

      // Remove global event listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('mouseup', stopPress);
        window.removeEventListener('touchend', stopPress);
        window.removeEventListener('touchcancel', stopPress);
      }
    };

    const startPress = () => {
      if (isPressed) return;

      isPressed = true;

      // Add global event listeners to catch release anywhere on the page
      if (typeof window !== 'undefined') {
        window.addEventListener('mouseup', stopPress);
        window.addEventListener('touchend', stopPress);
        window.addEventListener('touchcancel', stopPress);
      }

      // Execute action immediately on press
      action();

      // Delay before starting repeated execution
      timer = setTimeout(() => {
        // Start repeating every 250ms after initial delay
        interval = setInterval(() => {
          action();
        }, 250);
      }, 500);
    };

    return { startPress, stopPress };
  };

  const decrementHold = setupPressHold(decrement);
  const incrementHold = setupPressHold(increment);

  // Clean up timers and event listeners on component unmount
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
        component="input"
        type="range"
        class={styles.slider}
        name={props.name}
        value={localValue()}
        min={props.min}
        max={props.max}
        step={props.step}
        onInput={(e) => handleInput(parseFloat(e.target.value))}
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

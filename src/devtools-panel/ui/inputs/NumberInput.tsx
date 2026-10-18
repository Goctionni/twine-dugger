import type { JSX } from '@solidjs/web';
import clsx from 'clsx';

import { btnClass } from '../util/btnClass';
import { baseInputClasses } from '../util/common-classes';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

/** Without the tail that floating point leaves behind (0.1 + 0.2) */
const add = (value: number, amount: number) => +(value + amount).toFixed(6);

/** Without the tail that floating point leaves behind (0.3 * 10), and without cutting small numbers */
const scale = (value: number, direction: 1 | -1) =>
  Number((direction > 0 ? value * 10 : value / 10).toPrecision(15));

/**
 * The buttons, and the up and down keys, add 1; with Shift they add 10. Ctrl with up and down
 * multiplies by 10 and divides by 10.
 */
export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const safeOnChange = (newValue: number) => {
    if (!isNaN(newValue)) props.onChange(newValue);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const direction = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    const isScaling = event.ctrlKey && !event.shiftKey;
    const isStepping = !event.ctrlKey && !event.altKey && !event.metaKey;
    if (
      direction &&
      !props.readOnly &&
      !event.altKey &&
      !event.metaKey &&
      (isScaling || isStepping)
    ) {
      event.preventDefault();
      // What is typed, when it is a number; an empty or half typed field counts as 0
      const typed = (event.currentTarget as HTMLInputElement).valueAsNumber;
      const from = Number.isFinite(typed) ? typed : 0;
      props.onChange(
        isScaling ? scale(from, direction) : add(from, direction * (event.shiftKey ? 10 : 1)),
      );
      return;
    }
    props.onKeyDown?.(event);
  };

  return (
    <div class={clsx('flex', props.className)}>
      <button
        type="button"
        aria-label="Decrease"
        title="−1 (Shift: −10)"
        onClick={(event) => props.onChange(add(props.value, event.shiftKey ? -10 : -1))}
        disabled={isDisabled()}
        class={clsx(
          btnClass(
            'contained',
            '[REMOVE]: rounded-md px-4',
            'clr-gray hover:clr-sky w-7 rounded-l-md px-2 font-mono',
          ),
        )}
      >
        -
      </button>
      <input
        type="number"
        step="any"
        value={props.value}
        onInput={(e) => safeOnChange(e.target.valueAsNumber)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readonly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'w-32 rounded-none',
        )}
        {...props.inputProps}
      />
      <button
        type="button"
        aria-label="Increase"
        title="+1 (Shift: +10)"
        onClick={(event) => props.onChange(add(props.value, event.shiftKey ? 10 : 1))}
        disabled={isDisabled()}
        class={clsx(
          btnClass(
            'contained',
            '[REMOVE]: rounded-md px-4',
            'clr-gray hover:clr-sky w-7 rounded-r-md px-2 font-mono',
          ),
        )}
      >
        +
      </button>
    </div>
  );
}

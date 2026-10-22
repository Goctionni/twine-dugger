import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { btnClass } from '../util/btnClass';
import { baseInputClasses } from '../util/common-classes';
import { addToNumber, getSteppedNumber } from './step-number';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** The buttons and the keys stop here. What is typed is not held to it */
  min?: number;
  max?: number;
  /** Take the place of the − and + buttons */
  before?: JSX.Element;
  after?: JSX.Element;
  /** Takes the width that is left in a flex row, instead of a fixed one */
  fill?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

/**
 * The buttons, and the up and down keys, add 1; with Shift they add 10. Ctrl with up and down
 * multiplies by 10 and divides by 10.
 */
export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const clamp = (value: number) =>
    Math.min(Math.max(value, props.min ?? -Infinity), props.max ?? Infinity);
  const safeOnChange = (newValue: number) => {
    if (!isNaN(newValue)) props.onChange(newValue);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const stepped = props.readOnly ? undefined : getSteppedNumber(event);
    if (stepped === undefined) {
      props.onKeyDown?.(event);
      return;
    }
    event.preventDefault();
    props.onChange(clamp(stepped));
  };

  return (
    <div class={clsx('flex', props.fill && 'min-w-0 flex-1', props.className)}>
      <Switch>
        <Match when={props.before !== undefined}>{props.before}</Match>
        <Match when={props.before === undefined}>
          <button
            type="button"
            aria-label="Decrease"
            title="−1 (Shift: −10)"
            onClick={(event) =>
              props.onChange(clamp(addToNumber(props.value, event.shiftKey ? -10 : -1)))
            }
            disabled={isDisabled()}
            class={clsx(
              btnClass(
                'contained',
                '[REMOVE]: rounded-md px-4',
                '[REMOVE]: disabled:bg-gray-500 disabled:text-gray-300 disabled:hover:bg-gray-500',
                'disabled:opacity-35',
                'clr-gray hover:clr-sky w-7 rounded-l-md px-2 font-mono',
              ),
            )}
          >
            -
          </button>
        </Match>
      </Switch>
      <input
        type="number"
        step="any"
        min={props.min}
        max={props.max}
        value={props.value}
        onInput={(e) => safeOnChange(e.target.valueAsNumber)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readonly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          props.fill ? 'min-w-0 flex-1' : 'w-32',
          'rounded-none',
        )}
        {...props.inputProps}
      />
      <Switch>
        <Match when={props.after !== undefined}>{props.after}</Match>
        <Match when={props.after === undefined}>
          <button
            type="button"
            aria-label="Increase"
            title="+1 (Shift: +10)"
            onClick={(event) =>
              props.onChange(clamp(addToNumber(props.value, event.shiftKey ? 10 : 1)))
            }
            disabled={isDisabled()}
            class={clsx(
              btnClass(
                'contained',
                '[REMOVE]: rounded-md px-4',
                // A button that cannot be used is fainter, not brighter
                '[REMOVE]: disabled:bg-gray-500 disabled:text-gray-300 disabled:hover:bg-gray-500',
                'disabled:opacity-35',
                'clr-gray hover:clr-sky w-7 rounded-r-md px-2 font-mono',
              ),
            )}
          >
            +
          </button>
        </Match>
      </Switch>
    </div>
  );
}

import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { Match, Switch } from 'solid-js';

import { btnClass } from '../util/btnClass';
import { baseInputClasses } from '../util/common-classes';
import { addToNumber, getSteppedNumber } from './step-number';

interface NumberInputProps {
  value: number;
  valueText?: string;
  onChange: (value: number, valueText: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  before?: JSX.Element;
  after?: JSX.Element;
  fill?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;

  const clamp = (value: number) =>
    Math.min(Math.max(value, props.min ?? -Infinity), props.max ?? Infinity);
  const change = (value: number, valueStr?: string) => {
    if (!isNaN(value)) props.onChange(value, valueStr ?? String(value));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const stepped = props.readOnly ? undefined : getSteppedNumber(event);
    if (stepped === undefined) {
      props.onKeyDown?.(event);
      return;
    }
    event.preventDefault();
    change(clamp(stepped));
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
            onClick={(event) => change(clamp(addToNumber(props.value, event.shiftKey ? -10 : -1)))}
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
        value={props.valueText ?? props.value}
        onInput={(e) => change(e.target.valueAsNumber, e.target.value)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readonly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          props.fill ? 'min-w-0 flex-1' : 'w-32',
          'rounded-none text-center',
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
            onClick={(event) => change(clamp(addToNumber(props.value, event.shiftKey ? 10 : 1)))}
            disabled={isDisabled()}
            class={clsx(
              btnClass(
                'contained',
                '[REMOVE]: rounded-md px-4',
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

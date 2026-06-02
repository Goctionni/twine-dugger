import clsx from 'clsx';
import { JSX, createEffect, createSignal, on } from 'solid-js';

import { btnClass } from '../util/btnClass';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
}

const baseInputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

function sanitizeNumericInput(rawText: string) {
  if (rawText === '') return '';

  const stripped = rawText.replace(/[^0-9.-]/g, '');
  const withSingleLeadingMinus = stripped.replace(/(?!^)-/g, '');
  const firstDecimalPoint = withSingleLeadingMinus.indexOf('.');

  if (firstDecimalPoint === -1) return withSingleLeadingMinus;

  return (
    withSingleLeadingMinus.slice(0, firstDecimalPoint + 1) +
    withSingleLeadingMinus.slice(firstDecimalPoint + 1).replace(/\./g, '')
  );
}

export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const onKeyDown = (e: KeyboardEvent) => props.onKeyDown?.(e);

  // Keep track of the local string representation
  const [inputValue, setInputValue] = createSignal('');

  // Sync ONLY when props.value changes to a completely different mathematical value
  // from outside the component. We use `on` to explicitly track props.value.
  createEffect(
    on(
      () => props.value,
      (externalValue) => {
        if (inputValue() === '' || Number(inputValue()) !== externalValue) {
          setInputValue(String(externalValue));
        }
      },
      { defer: true },
    ), // defer: true prevents running on initial mount
  );

  return (
    <div class={clsx('flex', props.className)}>
      <button
        type="button"
        onClick={() => props.onChange(props.value - 1)}
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
        inputMode="decimal"
        type="text"
        value={inputValue()}
        onInput={(e) => {
          const target = e.currentTarget;
          const normalizedText = sanitizeNumericInput(target.value);

          // Force-assigning the sanitized text back to the DOM element here guarantees
          // that invalid letters are stripped immediately on every keystroke, keeping
          // the UI and testing environments completely locked in sync.
          target.value = normalizedText;
          setInputValue(normalizedText);

          const parsed = Number(normalizedText);

          if (normalizedText === '') {
            props.onChange(0);
          } else if (!isNaN(parsed)) {
            props.onChange(parsed);
          }
        }}
        onBlur={() => {
          const parsed = Number(inputValue());
          if (isNaN(parsed) || inputValue() === '') {
            props.onChange(0);
            setInputValue('0');
          } else {
            setInputValue(String(parsed));
          }
        }}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readOnly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'w-32 rounded-none',
        )}
        {...props.inputProps}
      />
      <button
        type="button"
        onClick={() => props.onChange(props.value + 1)}
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

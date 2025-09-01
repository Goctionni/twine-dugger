import clsx from 'clsx';
import { JSX } from 'solid-js';

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

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function NumberInput(props: NumberInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;
  const onKeyDown = (e: KeyboardEvent) => props.onKeyDown?.(e);

  return (
    <div class={clsx('flex', props.className)}>
      <button
        type="button"
        onClick={() => props.onChange(props.value - 1)}
        disabled={isDisabled()}
        class={clsx(
          buttonClasses,
          'rounded-l-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
          isDisabled() ? 'pointer-events-none text-gray-500' : 'text-white',
        )}
      >
        -
      </button>
      <input
        type="number"
        value={props.value}
        onInput={(e) => props.onChange(e.target.valueAsNumber)}
        onKeyDown={onKeyDown}
        disabled={props.disabled}
        readOnly={props.readOnly}
        class={clsx(
          baseInputClasses,
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          'w-32 rounded-none',
        )}
        {...props.inputProps}
      />
      <button
        type="button"
        onClick={() => props.onChange(props.value + 1)}
        disabled={isDisabled()}
        class={clsx(
          buttonClasses,
          'rounded-r-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
          isDisabled() ? 'pointer-events-none text-gray-500' : 'text-white',
        )}
      >
        +
      </button>
    </div>
  );
}

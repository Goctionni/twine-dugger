import clsx from 'clsx';
import { createEffect, createSignal } from 'solid-js';

interface NumberInputProps {
  value: () => number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
  onChange?: (v: number) => void;
}

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';
const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function NumberInput(props: NumberInputProps) {
  const min = props.min ?? -Infinity;
  const max = props.max ?? Infinity;

  const [input, setInput] = createSignal(String(props.value()));

  const update = (rawVal: string) => {
    const parsed = Number(rawVal);
    if (isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    setInput(String(clamped));
    props.setValue(clamped);
    props.onChange?.(clamped);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') update(input());
    if (e.key === 'Escape') setInput(String(props.value()));
  };

  createEffect(() => {
    setInput(String(props.value()));
  });

  return (
    <div class="flex gap-2">
      <div class="flex">
        <button
          type="button"
          onClick={() => update(String(props.value() - 1))}
          class={clsx(
            buttonClasses,
            'rounded-l-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
          )}
        >
          -
        </button>
        <input
          type="number"
          value={input()}
          min={min}
          max={max}
          onInput={e => setInput((e.target as HTMLInputElement).value)}
          onBlur={() => update(input())}
          onKeyDown={onKeyDown}
          class={clsx(
            inputClasses,
            `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`,
            `w-32`,
          )}
        />
        <button
          type="button"
          onClick={() => update(String(props.value() + 1))}
          class={clsx(
            buttonClasses,
            'rounded-r-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}

interface BooleanInputProps {
  value: () => boolean;
  setValue: (v: boolean) => void;
  onChange?: (v: boolean) => void;
}

export function BooleanInput(props: BooleanInputProps) {
  const [checked, setChecked] = createSignal(props.value());

  const update = (val: boolean) => {
    setChecked(val);
    props.setValue(val);
    props.onChange?.(val);
  };

  createEffect(() => {
    setChecked(props.value());
  });

  return (
    <label class="flex justify-start cursor-pointer select-none">
      <div class="relative flex justify-between w-[184px] h-7">
        <input
          type="checkbox"
          class="hidden peer"
          checked={checked()}
          onChange={(e) => update(e.target.checked)}
        />
        <span class="absolute toggle border-2 border-gray-500 h-7 w-1/2 rounded-sm transition-all top-0 left-1/2 peer-checked:left-0"></span>
        <span class="text-center flex-grow relative self-center transition text-white">Enable</span>
        <span class="text-center flex-grow relative self-center transition text-white">Disable</span>
      </div>
    </label>
  );
}

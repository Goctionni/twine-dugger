import clsx from 'clsx';
import { createEffect, createSignal, Show } from 'solid-js';

interface Props<T extends string | number | boolean> {
  id?: string;
  value: T;
  editable?: boolean;
  onChange?: (newValue: T) => void;
}

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';
const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function StringInput(props: Props<string>) {
  const [value, setValue] = createSignal(props.value);
  const onKeyDown = (e: KeyboardEvent) => {
    if (!props.editable) return;
    if (e.key === 'Enter') props.onChange?.(value());
    if (e.key === 'Escape') setValue(props.value);
  };
  createEffect(() => setValue(props.value));

  return (
    <div class="flex gap-2">
      <input
        type="text"
        value={value()}
        oninput={(e) => setValue(e.target.value)}
        onkeydown={onKeyDown}
        class={clsx(inputClasses, 'rounded-md w-[184px]')}
        readOnly={!props.editable}
        id={props.id}
      />
      <Show when={props.onChange && props.value !== value() && props.editable}>
        <button
          type="button"
          onclick={() => props.onChange?.(value())}
          class={clsx(
            buttonClasses,
            'text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
          )}
        >
          Save
        </button>
      </Show>
    </div>
  );
}

export function NumberInput(props: Props<number>) {
  const [value, setValue] = createSignal(props.value);
  const onKeyDown = (e: KeyboardEvent) => {
    if (!props.editable) return;
    if (e.key === 'Enter') props.onChange?.(value());
    if (e.key === 'Escape') setValue(props.value);
  };
  createEffect(() => setValue(props.value));

  return (
    <div class="flex gap-2">
      <div class="flex">
        <button
          type="button"
          onClick={() => setValue((prev) => prev - 1)}
          class={clsx(
            buttonClasses,
            'rounded-l-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
            props.editable ? 'text-white ' : 'pointer-events-none text-gray-500',
          )}
        >
          -
        </button>
        <input
          type="number"
          value={value()}
          oninput={(e) => setValue(e.target.valueAsNumber)}
          onkeydown={onKeyDown}
          readOnly={!props.editable}
          id={props.id}
          class={clsx(
            inputClasses,
            `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`,
            `w-32`,
          )}
        />
        <button
          type="button"
          onClick={() => setValue((prev) => prev + 1)}
          class={clsx(
            buttonClasses,
            'rounded-r-md font-mono px-2 w-7 bg-gray-600 hover:bg-sky-700 focus:ring-sky-500',
            props.editable ? 'text-white ' : 'pointer-events-none text-gray-500',
          )}
        >
          +
        </button>
      </div>
      <Show when={props.onChange && props.value !== value()}>
        <button
          type="button"
          onclick={() => props.onChange?.(value())}
          class={clsx(
            buttonClasses,
            'text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500',
          )}
        >
          Save
        </button>
      </Show>
    </div>
  );
}

export function BooleanInput(props: Props<boolean>) {
  const [checked, setChecked] = createSignal(props.value);
  createEffect(() => setChecked(props.value));

  return (
    <label
      class={clsx(
        'flex justify-start select-none',
        props.editable ? 'cursor-pointer' : 'pointer-events-none',
      )}
    >
      <div class="relative flex justify-between w-[184px] h-7">
        <input
          type="checkbox"
          class="hidden peer"
          checked={checked()}
          readOnly={!props.editable}
          onChange={(e) => props.onChange?.(e.target.checked)}
          id={props.id}
        />
        <span class="absolute toggle border-2 border-gray-500 h-7 w-1/2 rounded-sm transition-all top-0 left-1/2 peer-checked:left-0"></span>
        <span class="text-center flex-grow relative self-center transition text-white">True</span>
        <span class="text-center flex-grow relative self-center transition text-white">False</span>
      </div>
    </label>
  );
}

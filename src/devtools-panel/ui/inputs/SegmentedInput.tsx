import clsx from 'clsx';
import { For } from 'solid-js';

interface SegmentedInputProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  /** Names the group */
  label?: string;
  id?: string;
  class?: string;
}

/** Radios side by side, with a thumb that slides to the one that is chosen: like True | False, for any number of choices */
export function SegmentedInput<T extends string>(props: SegmentedInputProps<T>) {
  const name = `segmented-${crypto.randomUUID()}`;
  const getIndex = () => props.options.findIndex((option) => option.value === props.value);

  return (
    <fieldset
      id={props.id}
      role="radiogroup"
      aria-label={props.label}
      class={clsx(
        'relative flex h-7.5 w-75 text-white select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sky-400',
        props.class,
      )}
    >
      <span
        aria-hidden="true"
        class="absolute top-0 h-7.5 rounded-sm border-2 border-gray-200 bg-gray-200/15 transition-all"
        style={{
          width: `${100 / props.options.length}%`,
          left: `${(getIndex() * 100) / props.options.length}%`,
        }}
      />
      <For each={props.options}>
        {(option) => (
          <label
            class={clsx(
              'relative flex h-7.5 flex-1 items-center justify-center rounded-sm whitespace-nowrap',
              option.value === props.value ? 'cursor-default' : 'cursor-pointer hover:bg-white/10',
            )}
          >
            <input
              type="radio"
              name={name}
              class="sr-only"
              checked={option.value === props.value}
              onChange={() => props.onChange(option.value)}
            />
            {option.label}
          </label>
        )}
      </For>
    </fieldset>
  );
}

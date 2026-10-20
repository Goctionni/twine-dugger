import clsx from 'clsx';

interface BooleanInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Names the group */
  label?: string;
  /** Cannot be focused */
  disabled?: boolean;
  /** Can be focused, and does not change */
  readOnly?: boolean;
  /** Takes the width that is left in a flex row, instead of a fixed one */
  fill?: boolean;
  className?: string;
  id?: string;
}

/** True | False: two radios, with a thumb that slides to the one that is chosen */
export function BooleanInput(props: BooleanInputProps) {
  const name = `boolean-${crypto.randomUUID()}`;

  // The click is cancelled, so that the browser does not check the radio itself: what is checked
  // follows `value`, which is for the one that uses this to change when it takes the new value
  const choose = (event: MouseEvent, value: boolean) => {
    event.preventDefault();
    if (!props.readOnly && props.value !== value) props.onChange(value);
  };

  // Each half is a label as tall as the control. Browsers give a label its own cursor, so it is set
  // here, and only for the half that a click would change
  const labelClass = (isChosen: boolean) =>
    clsx(
      'relative flex flex-1 items-center justify-center rounded-sm',
      props.readOnly || isChosen ? 'cursor-default' : 'cursor-pointer hover:bg-white/10',
    );

  return (
    <fieldset
      id={props.id}
      role="radiogroup"
      aria-label={props.label}
      aria-readonly={props.readOnly ? 'true' : undefined}
      disabled={props.disabled}
      class={clsx(
        'relative flex h-7.5 text-white select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sky-400',
        props.fill ? 'min-w-0 flex-1' : 'w-46',
        props.disabled && 'pointer-events-none',
        props.className,
      )}
    >
      <span
        aria-hidden="true"
        class={clsx(
          'absolute top-0 h-7.5 w-1/2 rounded-sm border-2 transition-all',
          props.value
            ? 'left-0 border-gray-200 bg-gray-200/15'
            : 'left-1/2 border-gray-500 bg-gray-500/20',
        )}
      />
      <label class={labelClass(props.value)}>
        <input
          type="radio"
          name={name}
          class="sr-only"
          checked={props.value}
          onClick={(event) => choose(event, true)}
        />
        True
      </label>
      <label class={labelClass(!props.value)}>
        <input
          type="radio"
          name={name}
          class="sr-only"
          checked={!props.value}
          onClick={(event) => choose(event, false)}
        />
        False
      </label>
    </fieldset>
  );
}

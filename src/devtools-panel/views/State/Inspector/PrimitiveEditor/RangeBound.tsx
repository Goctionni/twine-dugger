import clsx from 'clsx';

import { getSteppedNumber } from '@/devtools-panel/ui/inputs/step-number';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';

interface Props {
  /** Names the bound for those who cannot see its caption */
  label: string;
  value: number;
  /** A number was typed and the field was left, or Enter was pressed */
  onCommit: (value: number) => void;
  class?: string;
}

/**
 * The minimum or the maximum of a lock. It is written when the field is left, not while typing or
 * stepping with the keys (the same keys as the number input has).
 */
export function RangeBound(props: Props) {
  const commit = (input: HTMLInputElement) => {
    const typed = input.valueAsNumber;
    // An empty or half typed field is not a number: the bound stays
    if (Number.isNaN(typed)) input.value = String(props.value);
    else if (typed !== props.value) props.onCommit(typed);
  };

  return (
    <input
      type="number"
      step="any"
      aria-label={props.label}
      value={props.value}
      class={clsx(
        baseInputClasses,
        'w-16 shrink-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        props.class,
      )}
      onChange={(event) => commit(event.currentTarget)}
      onBlur={(event) => commit(event.currentTarget)}
      onKeyDown={(event) => {
        const stepped = getSteppedNumber(event);
        if (stepped !== undefined) {
          event.preventDefault();
          event.currentTarget.value = String(stepped);
        } else if (event.key === 'Escape') {
          event.currentTarget.value = String(props.value);
        } else if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

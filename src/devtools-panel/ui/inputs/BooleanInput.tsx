import clsx from 'clsx';

interface BooleanInputProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  id?: string;
}

export function BooleanInput(props: BooleanInputProps) {
  const isDisabled = () => props.disabled || props.readOnly;

  return (
    <div class={clsx('flex justify-start gap-2 select-none', props.className)}>
      <div
        class={clsx(
          'relative flex h-7 w-46 justify-between',
          !isDisabled() ? 'cursor-pointer' : 'pointer-events-none',
        )}
      >
        <input
          type="checkbox"
          class="peer hidden"
          checked={props.value}
          readOnly={props.readOnly}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.target.checked)}
          id={props.id}
        />
        <span class="toggle absolute top-0 left-1/2 h-7 w-1/2 rounded-sm border-2 border-gray-500 transition-all peer-checked:left-0" />
        <label
          class="relative grow cursor-pointer self-center text-center text-white transition"
          for={props.id}
          onClick={(e) => {
            e.preventDefault();
            if (!isDisabled()) props.onChange(true);
          }}
        >
          True
        </label>
        <label
          class="relative grow cursor-pointer self-center text-center text-white transition"
          for={props.id}
          onClick={(e) => {
            e.preventDefault();
            if (!isDisabled()) props.onChange(false);
          }}
        >
          False
        </label>
      </div>
    </div>
  );
}

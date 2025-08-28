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
    <div class={clsx('flex justify-start select-none gap-2', props.className)}>
      <div
        class={clsx(
          'relative flex justify-between w-[184px] h-7',
          !isDisabled() ? 'cursor-pointer' : 'pointer-events-none'
        )}
      >
        <input
          type="checkbox"
          class="hidden peer"
          checked={props.value}
          readOnly={props.readOnly}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.target.checked)}
          id={props.id}
        />
        <span class="absolute toggle border-2 border-gray-500 h-7 w-1/2 rounded-sm transition-all top-0 left-1/2 peer-checked:left-0" />
        <label
          class="text-center flex-grow relative self-center transition text-white cursor-pointer"
          for={props.id}
          onClick={(e) => {
            e.preventDefault();
            if (!isDisabled()) props.onChange(true);
          }}
        >
          True
        </label>
        <label
          class="text-center flex-grow relative self-center transition text-white cursor-pointer"
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

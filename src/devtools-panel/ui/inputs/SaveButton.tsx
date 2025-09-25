import { btnClass } from '../util/btnClass';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function SaveButton(props: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      disabled={props.disabled}
      class={btnClass('contained', 'min-w-16')}
    >
      Save
    </button>
  );
}

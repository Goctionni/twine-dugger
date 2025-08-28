import clsx from 'clsx';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function SaveButton(props: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      disabled={props.disabled}
      class={clsx(
        buttonClasses,
        'min-w-16 text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
      )}
    >
      Save
    </button>
  );
}

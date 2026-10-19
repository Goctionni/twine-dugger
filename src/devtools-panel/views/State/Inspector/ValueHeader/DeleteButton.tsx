interface Props {
  disabled: boolean;
  onDelete: () => void;
}

export function DeleteButton(props: Props) {
  return (
    <button
      type="button"
      aria-label="Delete"
      title={props.disabled ? 'This value is locked, or in a set' : 'Delete this value'}
      disabled={props.disabled}
      class="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent"
      onClick={() => props.onDelete()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        delete
      </span>
    </button>
  );
}

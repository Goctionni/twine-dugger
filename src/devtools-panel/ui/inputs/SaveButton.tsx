interface SaveButtonProps {
  onClick: () => void;
}

/** Takes the place of the lock button while there is a change to save */
export function SaveButton(props: SaveButtonProps) {
  return (
    <button
      type="button"
      aria-label="Save"
      title="Save the change"
      class="inline-flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-sky-500 bg-sky-700 text-white hover:bg-sky-600"
      onClick={() => props.onClick()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        save
      </span>
    </button>
  );
}

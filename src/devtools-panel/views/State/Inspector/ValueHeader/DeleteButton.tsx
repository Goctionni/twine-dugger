interface Props {
  disabled: boolean;
  /** Why it is disabled; by default the value is locked or in a set */
  disabledTitle?: string;
  onDelete: () => void;
  tabindex?: number;
}

export function DeleteButton(props: Props) {
  return (
    <button
      type="button"
      aria-label="Delete"
      title={
        props.disabled
          ? (props.disabledTitle ?? 'This value is locked, or in a set')
          : 'Delete this value'
      }
      disabled={props.disabled}
      tabindex={props.tabindex}
      class="inline-flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-red-400/40 bg-red-400/10 text-red-400 hover:border-red-400 hover:bg-red-900 hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:border-red-400/40 disabled:hover:bg-red-400/10 disabled:hover:text-red-400"
      onClick={() => props.onDelete()}
    >
      <span aria-hidden="true" class="material-symbols-outlined text-lg leading-none">
        delete
      </span>
    </button>
  );
}

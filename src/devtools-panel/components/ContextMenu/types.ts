export interface ContextMenuItem {
  disabled?: boolean | (() => boolean);
  label: string | (() => string);
  onClick: () => void;
}

export interface ContextMenuRegistration {
  container: HTMLElement | undefined;
  items: ContextMenuItem[];
}

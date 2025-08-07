export interface ContextMenuItem {
  label: string;
  onClick: () => void;
}

export interface ContextMenuRegistration {
  container: HTMLElement | undefined;
  items: ContextMenuItem[];
}

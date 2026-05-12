import { Path } from '@/shared/shared-types';

type ContextMenuItem = {
  disabled?: boolean | (() => boolean);
  label: string | (() => string);
  onClick: () => void;
};

// Extension hooks intentionally return no-op lists in this branch.
// Other feature branches can extend context menus by overriding these helpers.
export function createDiffPathExtraMenuItems(_path: Path): ContextMenuItem[] {
  return [];
}

export function createObjectNavExtraMenuItems(_path: Path): ContextMenuItem[] {
  return [];
}

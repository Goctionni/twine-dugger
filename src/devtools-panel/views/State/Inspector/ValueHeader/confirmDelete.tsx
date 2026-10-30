import { showConfirmDialog } from '@/devtools-panel/ui/util/Prompt';

interface Kind {
  isArrayItem: boolean;
  /** A container: what is inside goes with it */
  hasContents: boolean;
}

export function confirmDelete(name: string, kind: Kind) {
  return showConfirmDialog(
    'Delete value',
    <>
      Delete <span class="font-mono">{name}</span> from the game state?
      {kind.hasContents && ' Everything inside it goes too.'}
      {kind.isArrayItem && ' The items after it move up one place.'}
    </>,
    'Delete',
  );
}

export function confirmDeleteMany(count: number) {
  return showConfirmDialog(
    'Delete values',
    `Delete ${count} values from the game state?`,
    'Delete',
  );
}

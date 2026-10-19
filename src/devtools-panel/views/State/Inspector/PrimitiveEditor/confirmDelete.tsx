import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';

/** Resolves with whether the person wants it gone; closing the dialog counts as no */
export async function confirmDelete(name: string, isArrayItem: boolean): Promise<boolean> {
  try {
    return await showPromptDialog<boolean>('Delete value', (answer) => (
      <div class="flex max-w-sm flex-col gap-4 py-2">
        <p class="text-sm">
          Delete <span class="font-mono">{name}</span> from the game state?
          {isArrayItem && ' The items after it move up one place.'}
        </p>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class={btnClass('outline', 'clr-gray')}
            onClick={() => answer(false)}
          >
            Cancel
          </button>
          <button type="button" class={btnClass('contained')} onClick={() => answer(true)}>
            Delete
          </button>
        </div>
      </div>
    ));
  } catch {
    return false;
  }
}

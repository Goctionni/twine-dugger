import { Match, Switch } from 'solid-js';

import type { SelectionKind } from '../types';
import { ContainerEditor } from './ContainerEditor/ContainerEditor';
import { PrimitiveEditor } from './PrimitiveEditor/PrimitiveEditor';

interface Props {
  selectionKind: SelectionKind;
  isOverlayOpen: boolean;
  onClose: () => void;
}

// Beside the navigator, below it (the sheet) or over it (the overlay): see the variants in style.css
export function Inspector(props: Props) {
  return (
    <aside
      class={[
        'min-h-0 w-75 shrink-0 overflow-auto border-l border-gray-700 bg-gray-900',
        'inspector-sheet:w-auto inspector-sheet:basis-[38%] inspector-sheet:border-t inspector-sheet:border-l-0',
        'inspector-overlay:absolute inspector-overlay:inset-0 inspector-overlay:z-10 inspector-overlay:w-auto inspector-overlay:border-0',
        !props.isOverlayOpen && 'inspector-overlay:hidden',
      ]}
    >
      <button
        type="button"
        class="float-right m-2 hidden cursor-pointer rounded-md border border-gray-500 px-2 py-0.5 text-sm hover:bg-gray-700 inspector-overlay:inline-block"
        onClick={() => props.onClose()}
      >
        ✕ Close
      </button>
      {/* Temporary: something to focus, to check the Tab order out of the Miller view */}
      <button
        type="button"
        class="m-2 cursor-pointer rounded-md border border-gray-500 px-2 py-0.5 text-sm hover:bg-gray-700"
      >
        Focus test
      </button>
      <Switch>
        <Match when={props.selectionKind === 'container'}>
          <ContainerEditor />
        </Match>
        <Match when={props.selectionKind === 'primitive'}>
          <PrimitiveEditor />
        </Match>
      </Switch>
    </aside>
  );
}

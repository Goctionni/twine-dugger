import { Match, Switch } from 'solid-js';

import type { SelectionKind } from '../types';
import { ContainerEditor } from './ContainerEditor/ContainerEditor';
import { PrimitiveEditor } from './PrimitiveEditor/PrimitiveEditor';

interface Props {
  selectionKind: SelectionKind;
}

export function Inspector(props: Props) {
  return (
    <aside class="min-h-0 w-80 shrink-0 overflow-auto border-l border-gray-700 bg-gray-900">
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

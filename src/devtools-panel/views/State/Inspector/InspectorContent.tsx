import { Match, Switch } from 'solid-js';

import type { Path } from '@/shared/shared-types';

import type { SelectionKind } from '../types';
import { ContainerEditor } from './ContainerEditor/ContainerEditor';
import { PrimitiveEditor } from './PrimitiveEditor/PrimitiveEditor';

interface Props {
  path: Path;
  /** Selects another path: the navigator shows it, and the breadcrumbs */
  onSelect: (path: Path) => void;
  selectionKind: SelectionKind;
}

/** The editor of the value at a path: what the State page and the search page show for a selection */
export function InspectorContent(props: Props) {
  return (
    <Switch>
      <Match when={props.selectionKind === 'container'}>
        <ContainerEditor path={props.path} />
      </Match>
      <Match when={props.selectionKind === 'primitive'}>
        <PrimitiveEditor path={props.path} onSelect={props.onSelect} />
      </Match>
    </Switch>
  );
}

import { Match, Switch } from 'solid-js';

import type { DiffChange } from '../../store/delta';
import { addFilteredPath, setViewState } from '../../store/store';
import { DiffPath } from './DiffPath';
import { MutationBadge } from './MutationBadge';
import { RenderValue } from './RenderValue';

type Change<K extends DiffChange['kind']> = Extract<DiffChange, { kind: K }>;

const goTo = (path: DiffChange['path']) => setViewState('state', 'path', [...path]);

// A change is immutable, so what is read from it here never needs to be tracked
export function DiffItem(props: { change: DiffChange }) {
  // oxlint-disable-next-line solid/reactivity
  const change = props.change;

  return (
    <Switch>
      <Match when={change.kind === 'chg' || change.kind === 'typ'}>
        <div class="whitespace-normal">
          <MutationBadge kind={change.kind === 'typ' ? 'typ' : 'chg'} />
          <DiffPath
            path={change.path}
            kinds={change.kinds}
            onClick={() => goTo(change.path)}
            onAddFilter={addFilteredPath}
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(change as Change<'chg' | 'typ'>).oldValue} />
          {' → '}
          <RenderValue value={(change as Change<'chg' | 'typ'>).newValue} />
        </div>
      </Match>
      <Match when={change.kind === 'add'}>
        <div class="whitespace-normal">
          <MutationBadge kind="add" />
          <DiffPath
            path={change.path}
            kinds={change.kinds}
            onClick={() => goTo(change.path)}
            onAddFilter={addFilteredPath}
            action="added"
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(change as Change<'add'>).value} />
        </div>
      </Match>
      <Match when={change.kind === 'del'}>
        <div class="whitespace-normal">
          <MutationBadge kind="del" />
          <DiffPath
            path={change.path}
            kinds={change.kinds}
            onClick={() => goTo(change.path.slice(0, -1))}
            onAddFilter={addFilteredPath}
            action="removed"
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(change as Change<'del'>).value} faded />
        </div>
      </Match>
      <Match when={change.kind === 'mov'}>
        <div class="whitespace-normal">
          <MutationBadge kind="mov" />
          <DiffPath
            path={change.path}
            kinds={change.kinds}
            onClick={() => goTo(change.path)}
            onAddFilter={addFilteredPath}
          />
          {' items reordered'}
        </div>
      </Match>
    </Switch>
  );
}

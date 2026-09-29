import type { JSX } from '@solidjs/web';
import { Match, Switch } from 'solid-js';

import type { Path } from '@/shared/shared-types';

import type { DiffChange } from '../../store/diff';
import { addFilteredPath, setViewState } from '../../store/store';
import type { BlockedWrite } from '../../store/store-types';
import { DiffPath } from './DiffPath';
import type { Kind } from './MutationBadge';
import { MutationBadge } from './MutationBadge';
import { RenderValue } from './RenderValue';

type Change<K extends DiffChange['kind']> = Extract<DiffChange, { kind: K }>;

interface ChangeLineProps {
  badge: Kind;
  path: Path;
  action?: 'added' | 'removed';
  /** Where clicking the path leads to, when that's not the path itself */
  goTo?: Path;
  children?: JSX.Element;
}

function ChangeLine(props: ChangeLineProps) {
  const goToPath = () => setViewState('state', 'path', [...(props.goTo ?? props.path)]);

  return (
    <div class="whitespace-normal">
      <MutationBadge kind={props.badge} />
      <DiffPath
        path={props.path}
        onClick={goToPath}
        onAddFilter={addFilteredPath}
        action={props.action}
      />
      {props.children}
    </div>
  );
}

const Colon = () => <code class="text-white">{': '}</code>;

// A change is immutable, so what is read from it here never needs to be tracked
export function DiffItem(props: { change: DiffChange }) {
  // oxlint-disable-next-line solid/reactivity
  const change = props.change;

  return (
    <Switch>
      <Match when={change.kind === 'chg' || change.kind === 'typ'}>
        <ChangeLine badge={change.kind === 'typ' ? 'typ' : 'chg'} path={change.path}>
          <Colon />
          <RenderValue value={(change as Change<'chg' | 'typ'>).oldValue} />
          {' → '}
          <RenderValue value={(change as Change<'chg' | 'typ'>).newValue} />
        </ChangeLine>
      </Match>
      <Match when={change.kind === 'add'}>
        <ChangeLine badge="add" path={change.path} action="added">
          <Colon />
          <RenderValue value={(change as Change<'add' | 'del'>).value} />
        </ChangeLine>
      </Match>
      <Match when={change.kind === 'del'}>
        {/* What was deleted isn't there to go to */}
        <ChangeLine badge="del" path={change.path} goTo={change.path.slice(0, -1)} action="removed">
          <Colon />
          <RenderValue value={(change as Change<'add' | 'del'>).value} faded />
        </ChangeLine>
      </Match>
      <Match when={change.kind === 'mov'}>
        <ChangeLine badge="mov" path={change.path}>
          {' items reordered'}
        </ChangeLine>
      </Match>
    </Switch>
  );
}

export function BlockedWriteItem(props: { write: BlockedWrite }) {
  return (
    <ChangeLine badge="lock" path={props.write.path}>
      {' was locked at '}
      <RenderValue value={props.write.locked} />
      {', the game tried '}
      <RenderValue value={props.write.attempted} faded />
    </ChangeLine>
  );
}

export const ReloadedItem = () => (
  <div class="whitespace-normal text-gray-300 italic">
    Game reloaded: what is below can't be travelled to
  </div>
);

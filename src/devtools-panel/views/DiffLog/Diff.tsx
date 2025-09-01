import { Match, Switch } from 'solid-js';

import {
  Diff,
  DiffArrayChange,
  DiffObjectMapChange,
  DiffPrimitiveUpdate,
  DiffSetChange,
  DiffTypeChange,
  Path,
  Value,
} from '@/shared/shared-types';

import { addFilteredPath, setViewState } from '../../store';
import { DiffPath } from './DiffPath';
import { MutationBadge } from './MutationBadge';
import { RenderValue } from './RenderValue';

const setPath = (path: Path) => setViewState('state', 'path', path);

function DiffItemTypeChanged(props: DiffChangeProps<DiffTypeChange>) {
  return (
    <div class="whitespace-normal">
      <MutationBadge kind="typ" />
      <DiffPath
        path={props.diff.path}
        onClick={() => setPath(props.diff.path)}
        onAddFilter={addFilteredPath}
      />
      <code class="text-white">{': '}</code>
      <RenderValue value={props.diff.oldValue} />
      {' → '}
      <RenderValue value={props.diff.newValue} />
    </div>
  );
}

function DiffPrimitiveChanged(props: DiffChangeProps<DiffPrimitiveUpdate>) {
  return (
    <div class="whitespace-normal">
      <MutationBadge kind="chg" />
      <DiffPath
        path={props.diff.path}
        onClick={() => setPath(props.diff.path)}
        onAddFilter={addFilteredPath}
      />
      <code class="text-white">{': '}</code>
      <RenderValue value={props.diff.oldValue} />
      {' → '}
      <RenderValue value={props.diff.newValue} />
    </div>
  );
}

function DiffListChanged(props: DiffChangeProps<DiffSetChange | DiffArrayChange>) {
  const action = () => {
    if (props.diff.subtype === 'add') return 'added' as const;
    if (props.diff.subtype === 'remove') return 'removed' as const;
    return undefined;
  };

  type AddDiff = (DiffSetChange | DiffArrayChange) & { subtype: 'add'; newValue: Value };
  type RemoveDiff = (DiffSetChange | DiffArrayChange) & { subtype: 'remove'; oldValue: Value };

  return (
    <Switch>
      <Match when={props.diff.subtype === 'instructions'}>
        <div class="whitespace-normal">
          <MutationBadge kind="mov" />
          <DiffPath
            path={props.diff.path}
            onClick={() => setPath(props.diff.path)}
            onAddFilter={addFilteredPath}
          />
          {' items reordered'}
        </div>
      </Match>
      <Match when={props.diff.subtype === 'add'}>
        <div class="whitespace-normal">
          <MutationBadge kind="add" />
          <DiffPath
            path={props.diff.path}
            onClick={() => setPath(props.diff.path)}
            onAddFilter={addFilteredPath}
            action={action()}
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as AddDiff).newValue} />
        </div>
      </Match>
      <Match when={props.diff.subtype === 'remove'}>
        <div class="whitespace-normal">
          <MutationBadge kind="del" />
          <DiffPath
            path={props.diff.path}
            onClick={() => setPath(props.diff.path)}
            onAddFilter={addFilteredPath}
            action={action()}
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as RemoveDiff).oldValue} faded />
        </div>
      </Match>
    </Switch>
  );
}

function DiffRecordChanged(props: DiffChangeProps<DiffObjectMapChange>) {
  const onClick = () => {
    if (props.diff.subtype === 'add') setPath([...props.diff.path, props.diff.key]);
    else setPath(props.diff.path);
  };

  type AddDiff = DiffObjectMapChange & { subtype: 'add'; newValue: Value };
  type RemoveDiff = DiffObjectMapChange & { subtype: 'remove'; oldValue: Value };

  return (
    <Switch>
      <Match when={props.diff.subtype === 'add'}>
        <div class="whitespace-normal">
          <MutationBadge kind="add" />
          <DiffPath
            path={props.diff.path}
            leafKey={props.diff.key}
            onClick={onClick}
            onAddFilter={addFilteredPath}
            action="added"
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as AddDiff).newValue} />
        </div>
      </Match>
      <Match when={props.diff.subtype === 'remove'}>
        <div class="whitespace-normal">
          <MutationBadge kind="del" />
          <DiffPath
            path={props.diff.path}
            leafKey={props.diff.key}
            onClick={onClick}
            onAddFilter={addFilteredPath}
            action="removed"
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as RemoveDiff).oldValue} faded />
        </div>
      </Match>
    </Switch>
  );
}

interface DiffChangeProps<T extends Diff> {
  diff: T;
}

export function DiffItem(props: DiffChangeProps<Diff>) {
  const type = () => {
    if (props.diff.type !== 'array') return props.diff.type;
    if (props.diff.subtype !== 'instructions') return props.diff.type;
    if (props.diff.instructions.some((inst) => inst.type === 'move')) return props.diff.type;
    return 'hide';
  };
  const primitives = ['string', 'number', 'boolean'];
  return (
    <Switch>
      <Match when={type() === 'type-changed'}>
        <DiffItemTypeChanged diff={props.diff as DiffTypeChange} />
      </Match>
      <Match when={primitives.includes(type() as string)}>
        <DiffPrimitiveChanged diff={props.diff as DiffPrimitiveUpdate} />
      </Match>
      <Match when={type() === 'set'}>
        <DiffListChanged diff={props.diff as DiffSetChange} />
      </Match>
      <Match when={type() === 'array'}>
        <DiffListChanged diff={props.diff as DiffArrayChange} />
      </Match>
      <Match when={type() === 'map'}>
        <DiffRecordChanged diff={props.diff as DiffObjectMapChange} />
      </Match>
      <Match when={type() === 'object'}>
        <DiffRecordChanged diff={props.diff as DiffObjectMapChange} />
      </Match>
    </Switch>
  );
}

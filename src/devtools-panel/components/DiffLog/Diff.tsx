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
import { Badge } from './Badge';
import { RenderPath } from './RenderPath';
import { RenderValue } from './RenderValue';

function DiffItemTypeChanged(props: DiffChangeProps<DiffTypeChange>) {
  return (
    <div class="whitespace-normal">
      <Badge kind="typ" />
      <RenderPath
        path={props.diff.path}
        onClick={() => props.setPath(props.diff.path)}
        onAddFilter={props.onAddFilter}
        showColon
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
      <Badge kind="chg" />
      <RenderPath
        path={props.diff.path}
        onClick={() => props.setPath(props.diff.path)}
        onAddFilter={props.onAddFilter}
        showColon
      />
      <code class="text-white">{': '}</code>
      <RenderValue value={props.diff.oldValue} />
      {' → '}
      <RenderValue value={props.diff.newValue} />
    </div>
  );
}

function DiffListChanged(props: DiffChangeProps<DiffSetChange | DiffArrayChange>) {
  const leafMode = () => {
    if (props.diff.subtype === 'add') return 'add';
    if (props.diff.subtype === 'remove') return 'del';
  };

  type AddDiff = (DiffSetChange | DiffArrayChange) & { subtype: 'add'; newValue: Value };
  type RemoveDiff = (DiffSetChange | DiffArrayChange) & { subtype: 'remove'; oldValue: Value };

  return (
    <Switch>
      <Match when={props.diff.subtype === 'instructions'}>
        <div class="whitespace-normal">
          <Badge kind="mov" />
          <RenderPath
            path={props.diff.path}
            onClick={() => props.setPath(props.diff.path)}
            onAddFilter={props.onAddFilter}
            showColon
          />
          {' items reordered'}
        </div>
      </Match>
      <Match when={props.diff.subtype === 'add'}>
        <div class="whitespace-normal">
          <Badge kind="add" />
          <RenderPath
            path={props.diff.path}
            onClick={() => props.setPath(props.diff.path)}
            onAddFilter={props.onAddFilter}
            leafMode={leafMode()}
            showColon
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as AddDiff).newValue} />
        </div>
      </Match>
      <Match when={props.diff.subtype === 'remove'}>
        <div class="whitespace-normal">
          <Badge kind="del" />
          <RenderPath
            path={props.diff.path}
            onClick={() => props.setPath(props.diff.path)}
            onAddFilter={props.onAddFilter}
            leafMode={leafMode()}
            showColon
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
    if (props.diff.subtype === 'add') props.setPath([...props.diff.path, props.diff.key]);
    else props.setPath(props.diff.path);
  };

  type AddDiff = DiffObjectMapChange & { subtype: 'add'; newValue: Value };
  type RemoveDiff = DiffObjectMapChange & { subtype: 'remove'; oldValue: Value };

  return (
    <Switch>
      <Match when={props.diff.subtype === 'add'}>
        <div class="whitespace-normal">
          <Badge kind="add" />
          <RenderPath
            path={props.diff.path}
            leafKey={props.diff.key}
            onClick={onClick}
            onAddFilter={props.onAddFilter}
            leafMode="add"
            showColon
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as AddDiff).newValue} />
        </div>
      </Match>
      <Match when={props.diff.subtype === 'add'}>
        <div class="whitespace-normal">
          <Badge kind="del" />
          <RenderPath
            path={props.diff.path}
            leafKey={props.diff.key}
            onClick={onClick}
            onAddFilter={props.onAddFilter}
            leafMode="del"
            showColon
          />
          <code class="text-white">{': '}</code>
          <RenderValue value={(props.diff as RemoveDiff).oldValue} faded />
        </div>
      </Match>
    </Switch>
  );
}

interface DiffChangeProps<T> {
  diff: T;
  setPath: (path: Path) => void;
  onAddFilter: (path: string) => void;
}

export function DiffItem(props: {
  diff: Diff;
  setPath: (path: Path) => void;
  onAddFilter: (path: string) => void;
}) {
  const type = () => {
    if (props.diff.type !== 'array') return props.diff.type;
    if (props.diff.subtype !== 'instructions') return props.diff.type;
    if (props.diff.instructions.some((inst) => inst.type === 'move')) return props.diff.type;
    return 'hide';
  };
  const primitives = ['string', 'number', 'boolean'];
  const baseProps = { setPath: props.setPath, onAddFilter: props.onAddFilter };
  return (
    <Switch>
      <Match when={type() === 'type-changed'}>
        <DiffItemTypeChanged diff={props.diff as DiffTypeChange} {...baseProps} />
      </Match>
      <Match when={primitives.includes(type() as string)}>
        <DiffPrimitiveChanged diff={props.diff as DiffPrimitiveUpdate} {...baseProps} />
      </Match>
      <Match when={type() === 'set'}>
        <DiffListChanged diff={props.diff as DiffSetChange} {...baseProps} />
      </Match>
      <Match when={type() === 'array'}>
        <DiffListChanged diff={props.diff as DiffArrayChange} {...baseProps} />
      </Match>
      <Match when={type() === 'map'}>
        <DiffRecordChanged diff={props.diff as DiffObjectMapChange} {...baseProps} />
      </Match>
      <Match when={type() === 'object'}>
        <DiffRecordChanged diff={props.diff as DiffObjectMapChange} {...baseProps} />
      </Match>
    </Switch>
  );
}

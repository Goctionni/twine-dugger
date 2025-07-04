import { For, Match, Switch } from 'solid-js';
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
import { getSpecificType } from '@/shared/type-helpers';

const colorClasses = {
  pathRoot: 'text-sky-500',
  pathChunk: 'text-sky-400',
  pathDot: 'text-white',
  pathBrackets: 'text-yellow-300',
  typeNumber: 'text-emerald-300 saturate-50',
  typeString: 'text-orange-300 saturate-50',
  typeBoolean: 'text-blue-500',
  typeEmpty: 'text-gray-400',
  typeOther: 'text-red-200',
} as const;

function RenderValue(props: { value: Value }) {
  const value = () => props.value;
  const type = () => typeof value();

  const renderType = () => {
    const t = type();
    if (t === 'string' && !value()) return 'empty';
    if (t === 'string') return 'string';
    if (t === 'boolean') return 'boolean';
    if (t === 'number') return 'number';
    return 'type';
  };

  return (
    <Switch fallback={<code class={colorClasses.typeOther}>{getSpecificType(value())}</code>}>
      <Match when={renderType() === 'empty'}>
        <code class={colorClasses.typeEmpty}>Empty string</code>
      </Match>
      <Match when={renderType() === 'boolean'}>
        <code class={colorClasses.typeBoolean}>{JSON.stringify(value())}</code>
      </Match>
      <Match when={renderType() === 'number'}>
        <code class={colorClasses.typeNumber}>{value() as number}</code>
      </Match>
      <Match when={renderType() === 'string'}>
        <code class={colorClasses.typeString}>{JSON.stringify(value())}</code>
      </Match>
    </Switch>
  );
}

interface DiffChangeProps<T> {
  diff: T;
  setPath: (path: Path) => void;
}

function DiffItemTypeChanged(props: DiffChangeProps<DiffTypeChange>) {
  return (
    <div>
      <RenderPath path={props.diff.path} onClick={() => props.setPath(props.diff.path)} />
      {` Changed from `}
      <RenderValue value={props.diff.oldValue} />
      {` to `}
      <RenderValue value={props.diff.newValue} />
    </div>
  );
}

function DiffPrimitiveChanged(props: DiffChangeProps<DiffPrimitiveUpdate>) {
  return (
    <div>
      <RenderPath path={props.diff.path} onClick={() => props.setPath(props.diff.path)} />
      {` Changed from `}
      <RenderValue value={props.diff.oldValue} />
      {' to '}
      <RenderValue value={props.diff.newValue} />
    </div>
  );
}

function DiffListChanged(props: DiffChangeProps<DiffSetChange | DiffArrayChange>) {
  function getChange(diff: DiffSetChange | DiffArrayChange) {
    if (diff.subtype === 'add') {
      return (
        <>
          Value added <RenderValue value={diff.newValue} />
        </>
      );
    }
    if (diff.subtype === 'remove') {
      return (
        <>
          Value removed <RenderValue value={diff.oldValue} />
        </>
      );
    }
    if (diff.subtype === 'instructions' && diff.instructions.some((inst) => inst.type === 'move')) {
      return 'Values were moved around';
    }
  }
  return (
    <div>
      <RenderPath path={props.diff.path} onClick={() => props.setPath(props.diff.path)} />{' '}
      {getChange(props.diff)}
    </div>
  );
}

function DiffRecordChanged(props: DiffChangeProps<DiffObjectMapChange>) {
  function getChange(diff: DiffObjectMapChange) {
    if (diff.subtype === 'add') {
      return (
        <>
          Property <RenderValue value={diff.key} /> added <RenderValue value={diff.newValue} />
        </>
      );
    }
    if (diff.subtype === 'remove') {
      return (
        <>
          Property <RenderValue value={diff.key} /> removed <RenderValue value={diff.oldValue} />
        </>
      );
    }
  }

  const onClick = () => {
    if (props.diff.subtype === 'add') {
      props.setPath([...props.diff.path, props.diff.key]);
    } else {
      props.setPath(props.diff.path);
    }
  };

  return (
    <div>
      <RenderPath path={props.diff.path} onClick={onClick} /> {getChange(props.diff)}
    </div>
  );
}

interface Props {
  diff: Diff;
  setPath: (path: Path) => void;
}

export function DiffItem(props: Props) {
  const diff = () => props.diff;
  const type = () => {
    const _diff = diff();
    if (_diff.type !== 'array') return _diff.type;
    if (_diff.subtype !== 'instructions') return _diff.type;
    if (_diff.instructions.some((inst) => inst.type === 'move')) return _diff.type;
    return 'hide';
  };
  const primitives = ['string', 'number', 'boolean'];
  return (
    <Switch>
      <Match when={type() === 'type-changed'}>
        <DiffItemTypeChanged diff={diff() as DiffTypeChange} setPath={props.setPath} />
      </Match>
      <Match when={primitives.includes(type() as string)}>
        <DiffPrimitiveChanged diff={diff() as DiffPrimitiveUpdate} setPath={props.setPath} />
      </Match>
      <Match when={type() === 'set'}>
        <DiffListChanged diff={diff() as DiffSetChange} setPath={props.setPath} />
      </Match>
      <Match when={type() === 'array'}>
        <DiffListChanged diff={diff() as DiffArrayChange} setPath={props.setPath} />
      </Match>
      <Match when={type() === 'map'}>
        <DiffRecordChanged diff={diff() as DiffObjectMapChange} setPath={props.setPath} />
      </Match>
      <Match when={type() === 'object'}>
        <DiffRecordChanged diff={diff() as DiffObjectMapChange} setPath={props.setPath} />
      </Match>
    </Switch>
  );
}

function RenderPath(props: { path: Path; onClick: () => void }) {
  return (
    <code onClick={props.onClick} class="hover:underline cursor-pointer">
      <For each={props.path}>{(chunk, index) => <PathChunk index={index()} chunk={chunk} />}</For>
    </code>
  );
}

interface PathChunkProps {
  chunk: Path[number];
  index: number;
}

function PathChunk(props: PathChunkProps) {
  const renderAs = () => {
    if (props.index === 0) return 'plain';
    if (typeof props.chunk === 'number') return 'index';
    if (/^[0-9]+$/.test(props.chunk)) return 'index';
    return 'property';
  };
  return (
    <Switch>
      <Match when={renderAs() === 'plain'}>
        <span class={colorClasses.pathRoot}>{props.chunk}</span>
      </Match>
      <Match when={renderAs() === 'index'}>
        <span class={colorClasses.pathBrackets}>[</span>
        <span class={colorClasses.typeNumber}>{props.chunk}</span>
        <span class={colorClasses.pathBrackets}>]</span>
      </Match>
      <Match when={renderAs() === 'property'}>
        <span class={colorClasses.pathDot}>.</span>
        <span class={colorClasses.pathChunk}>{props.chunk}</span>
      </Match>
    </Switch>
  );
}

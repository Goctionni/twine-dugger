import { Path } from '@/shared/shared-types';
import { createContextMenuHandler } from '../ContextMenu';
import { For, Match, Switch } from 'solid-js';
import clsx from 'clsx';

const colorClasses = {
  pathRoot: 'text-sky-500',
  pathChunk: 'text-sky-400',
  pathDot: 'text-white',
  pathBrackets: 'text-yellow-300',
  typeNumber: 'text-emerald-300 saturate-50',
} as const;

const leafColors = {
  add: 'text-green-400!',
  del: 'text-red-400!',
} as const;

export function RenderPath(props: {
  path: Path;
  onClick: () => void;
  onAddFilter: (path: string) => void;
  leafMode?: keyof typeof leafColors;
  leafKey?: Path[number];
  showColon?: boolean;
}) {
  const fullPath = () =>
    props.leafKey === undefined ? props.path : [...props.path, props.leafKey];
  const pathString = () => fullPath().join('.');
  const lastIndex = () => fullPath().length - 1;
  const onContextMenu = createContextMenuHandler([
    {
      label: `Filter out changes to "${pathString()}"`,
      onClick: () => props.onAddFilter(pathString()),
    },
  ]);
  return (
    <code
      onContextMenu={onContextMenu}
      onClick={props.onClick}
      class="hover:underline cursor-pointer"
    >
      <For each={fullPath()}>
        {(chunk, index) => (
          <PathChunk
            index={index()}
            chunk={chunk}
            leafClass={
              index() === lastIndex() && props.leafMode ? leafColors[props.leafMode] : undefined
            }
          />
        )}
      </For>
    </code>
  );
}

function PathChunk(props: { chunk: Path[number]; index: number; leafClass?: string }) {
  const renderAs = () => {
    if (props.index === 0) return 'plain';
    if (typeof props.chunk === 'number' || /^[0-9]+$/.test(props.chunk)) return 'index';
    return 'property';
  };
  return (
    <Switch>
      <Match when={renderAs() === 'plain'}>
        <span class={clsx(colorClasses.pathRoot, props.leafClass)}>{props.chunk}</span>
      </Match>
      <Match when={renderAs() === 'index'}>
        <span class={colorClasses.pathBrackets}>[</span>
        <span class={clsx(colorClasses.typeNumber, props.leafClass)}>{props.chunk}</span>
        <span class={colorClasses.pathBrackets}>]</span>
      </Match>
      <Match when={renderAs() === 'property'}>
        <span class={colorClasses.pathDot}>.</span>
        <span class={clsx(colorClasses.pathChunk, props.leafClass)}>{props.chunk}</span>
      </Match>
    </Switch>
  );
}

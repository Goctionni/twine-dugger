import { Match, Switch, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { PrettyPath } from '@/devtools-panel/ui/display/PrettyPath';
import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { BooleanEditor } from './BooleanEditor';
import { StringEditor } from './StringEditor';

interface Props {
  path: Path;
}

export function PrimitiveEditor(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const getTitle = () => getPathLabels(getLatestState(), props.path).at(-1) ?? 'State';

  return (
    <div class="flex flex-col gap-3 p-3">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <TypeIcon type={getType()} />
          <h2 class="font-mono text-base font-semibold break-all">{getTitle()}</h2>
        </div>
        <PrettyPath
          class="font-mono text-xs break-all text-gray-400"
          path={props.path}
          statePrefix
        />
      </header>
      <Switch>
        <Match when={getType() === 'boolean'}>
          <BooleanEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'string'}>
          <StringEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() !== 'boolean' && getType() !== 'string'}>
          <RenderValue value={getValue()} />
        </Match>
      </Switch>
    </div>
  );
}

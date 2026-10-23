import { Match, Switch, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getPathLabels } from '../../logic/path-labels';
import { ValueHeader } from '../ValueHeader/ValueHeader';
import { BooleanEditor } from './BooleanEditor';
import { InvalidNumberEditor } from './InvalidNumberEditor';
import { NumberEditor } from './NumberEditor';
import { StringEditor } from './StringEditor';
import { ValueTabs } from './ValueTabs';

interface Props {
  path: Path;
  onSelect: (path: Path) => void;
}

export function PrimitiveEditor(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));
  const getTitle = () => getPathLabels(getLatestState(), props.path).at(-1) ?? 'State';

  return (
    <div class="flex flex-col gap-3 p-3">
      <ValueHeader path={props.path} />
      <Switch>
        <Match when={getType() === 'boolean'}>
          <BooleanEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'string'}>
          <StringEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'number'}>
          <NumberEditor path={props.path} label={getTitle()} />
        </Match>
        <Match when={getType() === 'NaN' || getType() === 'infinity'}>
          <InvalidNumberEditor path={props.path} />
        </Match>
        <Match when={!['boolean', 'string', 'number', 'NaN', 'infinity'].includes(getType())}>
          <RenderValue value={getValue()} disableInvalidHighlight />
        </Match>
      </Switch>
      <ValueTabs path={props.path} onSelect={props.onSelect} />
    </div>
  );
}

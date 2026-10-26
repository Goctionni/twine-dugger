import { Match, Switch, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { RenderValue } from '@/devtools-panel/views/DiffLog/RenderValue';
import { getJsonType, getPathValue } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { BooleanEditor } from './BooleanEditor';
import { DateEditor } from './DateEditor';
import { InvalidNumberEditor } from './InvalidNumberEditor';
import { NumberEditor } from './NumberEditor';
import { StringEditor } from './StringEditor';

interface Props {
  path: Path;
  /** What the editors are called for assistive technology */
  label: string;
  /** For a row of the grid: smaller editors, and NaN and the infinities are shown, not offered a fix */
  compact?: boolean;
}

/** The editor for the type of the primitive at a path; what has no editor is shown as it is */
export function ValueEditor(props: Props) {
  const getValue = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getValue()));

  return (
    <Switch
      fallback={
        <div class={props.compact ? 'flex min-h-7.5 min-w-0 items-center text-sm' : undefined}>
          <RenderValue value={getValue()} disableInvalidHighlight />
        </div>
      }
    >
      <Match when={getType() === 'boolean'}>
        <BooleanEditor path={props.path} label={props.label} />
      </Match>
      <Match when={getType() === 'string'}>
        <StringEditor path={props.path} label={props.label} compact={props.compact} />
      </Match>
      <Match when={getType() === 'number'}>
        <NumberEditor path={props.path} label={props.label} compact={props.compact} />
      </Match>
      <Match when={getType() === 'date'}>
        <DateEditor path={props.path} label={props.label} compact={props.compact} />
      </Match>
      <Match when={!props.compact && (getType() === 'NaN' || getType() === 'infinity')}>
        <InvalidNumberEditor path={props.path} />
      </Match>
    </Switch>
  );
}

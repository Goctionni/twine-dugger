import { createSignal, Match, Switch, untrack } from 'solid-js';

import { setPassage } from '@/devtools-panel/api/api';
import { Code } from '@/devtools-panel/ui/code';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { ParsedPassageData } from '@/shared/shared-types';

import { PassageHeader } from './PassageHeader';

interface Props {
  passage: ParsedPassageData | null;
  language: string;
}

export function PassageView(props: Props) {
  const [edit, setEdit] = createSignal(false);
  const [code, setCode] = createSignal(untrack(() => props.passage?.content ?? ''));

  return (
    <Switch fallback={<div class="py-2">No passage selected.</div>}>
      <Match when={props.passage}>
        <div class="flex h-full w-full flex-col overflow-auto px-4 py-2">
          <PassageHeader passage={props.passage!} />
          <button class={btnClass('contained')} onClick={() => setEdit(!edit())}>
            Edit
          </button>
          {edit() ? (
            <div>
              <div>
                <textarea value={code()} onInput={(e) => setCode(e.target.value)} />
              </div>
              <button
                class={btnClass('contained')}
                onClick={() => setPassage({ name: props.passage!.name, source: code() })}
              >
                Save
              </button>
            </div>
          ) : (
            <Code code={props.passage!.content ?? ''} format={props.language} />
          )}
        </div>
      </Match>
    </Switch>
  );
}

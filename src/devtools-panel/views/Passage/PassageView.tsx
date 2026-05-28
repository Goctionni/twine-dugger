import { createSignal, Match, Switch } from 'solid-js';

import { setPassage } from '@/devtools-panel/api/api';
import { Code } from '@/devtools-panel/ui/code';
import { ParsedPassageData } from '@/shared/shared-types';

import { PassageHeader } from './PassageHeader';

interface Props {
  passage: ParsedPassageData | null;
  language: string;
}

export function PassageView(props: Props) {
  const [editable, setEditable] = createSignal(false);

  const onSave = (code: string) => {
    const name = props.passage?.name;
    if (name) setPassage({ name, source: code });
    setEditable(false);
  };

  return (
    <Switch fallback={<div class="py-2">No passage selected.</div>}>
      <Match when={props.passage}>
        <div class="flex h-full w-full flex-col overflow-auto px-4 py-2">
          <PassageHeader passage={props.passage!} editable={editable()} setEditable={setEditable} />
          <Code
            code={props.passage!.content ?? ''}
            format={props.language}
            editable={editable()}
            onSave={onSave}
          />
        </div>
      </Match>
    </Switch>
  );
}

import { Match, Switch } from 'solid-js';

import { Code } from '@/devtools-panel/ui/code';
import { ParsedPassageData } from '@/shared/shared-types';

import { PassageHeader } from './PassageHeader';

interface Props {
  passage: ParsedPassageData | null;
  language: string;
}

export function PassageView(props: Props) {
  return (
    <Switch fallback={<div class="py-2">No passage selected.</div>}>
      <Match when={props.passage}>
        <div class="w-full h-full overflow-auto px-4 py-2 flex flex-col">
          <PassageHeader passage={props.passage!} />
          <Code code={props.passage!.content ?? ''} format={props.language} />
        </div>
      </Match>
    </Switch>
  );
}

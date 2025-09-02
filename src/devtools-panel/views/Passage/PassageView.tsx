import { For, Match, Switch } from 'solid-js';

import { Code } from '@/devtools-panel/ui/code';
import { Tag } from '@/devtools-panel/ui/display/Tag';
import { ParsedPassageData } from '@/shared/shared-types';

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

interface PassageHeaderProps {
  passage: ParsedPassageData;
}

function PassageHeader(props: PassageHeaderProps) {
  return (
    <div class="py-2 flex gap-2">
      <h3 class="text-lg">Selected Passage: {props.passage!.name}</h3>
      <div class="flex gap-1 ">
        <For each={props.passage!.tags}>{(tag) => <Tag tag={tag} />}</For>
      </div>
    </div>
  );
}

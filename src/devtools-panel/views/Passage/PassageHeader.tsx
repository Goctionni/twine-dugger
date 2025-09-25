import { For } from 'solid-js';

import { Tag } from '@/devtools-panel/ui/display/Tag';
import { ParsedPassageData } from '@/shared/shared-types';

interface PassageHeaderProps {
  passage: ParsedPassageData;
}

export function PassageHeader(props: PassageHeaderProps) {
  return (
    <div class="py-2 flex gap-2">
      <h3 class="text-lg">Selected Passage: {props.passage!.name}</h3>
      <div class="flex gap-1 ">
        <For each={props.passage!.tags}>{(tag) => <Tag tag={tag} />}</For>
      </div>
    </div>
  );
}

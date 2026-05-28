import { For, Setter } from 'solid-js';

import { goToPassage } from '@/devtools-panel/api/api';
import { Tag } from '@/devtools-panel/ui/display/Tag';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { ParsedPassageData } from '@/shared/shared-types';

import { Toggle } from './Toggle';

interface PassageHeaderProps {
  passage: ParsedPassageData;
  editable: boolean;
  setEditable: Setter<boolean>;
}

export function PassageHeader(props: PassageHeaderProps) {
  return (
    <div class="flex gap-2 py-2">
      <h3 class="text-lg">Selected Passage: {props.passage!.name}</h3>
      <div class="flex gap-1">
        <For each={props.passage!.tags}>{(tag) => <Tag tag={tag} />}</For>
      </div>
      <div class="flex flex-1 justify-between gap-2">
        <button
          type="button"
          onClick={() => goToPassage(props.passage!.name)}
          class={btnClass('contained', 'min-w-16')}
        >
          Go to passage
        </button>
        <Toggle checked={props.editable} onChange={props.setEditable} label="Edit Code" />
      </div>
    </div>
  );
}

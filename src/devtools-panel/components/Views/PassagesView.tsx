import clsx from 'clsx';
import { createMemo, For } from 'solid-js';

import { PassageData } from '@/shared/shared-types';

import { MovableSplit } from '../Layout/MovableSplit';
import { PassageCode } from '../SyntaxHighlight/PassageCode';
import {
  getSelectedPassage,
  ParsedPassageData,
  parsePassage,
  setSelectedPassage,
} from './passageDataStore';

interface Props {
  passageData?: PassageData[];
  format?: 'SugarCube' | 'Harlowe';
}

export function PassagesView(props: Props) {
  const formatted = createMemo(() => {
    if (!props.passageData?.length) return null;
    return props.passageData.map(parsePassage);
  });
  return (
    <MovableSplit
      initialLeftWidthPercent={35}
      leftContent={
        <div class="px-4 py-2 h-full flex flex-col overflow-auto">
          <h1 class="font-bold text-xl mb-2">Passages</h1>
          <ul class="flex-1 flex flex-col overflow-auto">
            <For each={formatted()}>
              {(item) => (
                <ListItem
                  passageData={item}
                  onClick={() => setSelectedPassage(item)}
                  active={getSelectedPassage()?.id === item.id}
                />
              )}
            </For>
          </ul>
        </div>
      }
      rightContent={
        <div class="w-full h-full overflow-auto px-4 py-2 flex flex-col">
          <div class="py-2 flex gap-2">
            <h3 class="text-lg">Selected Passage: {getSelectedPassage()?.name}</h3>
            <div class="flex gap-1 ">
              <For each={getSelectedPassage()?.tags}>{(tag) => <Tag tag={tag} />}</For>
            </div>
          </div>
          <PassageCode code={getSelectedPassage()?.content ?? ''} format={props.format} />
        </div>
      }
    />
  );
}

interface ListItemProps {
  passageData: ParsedPassageData;
  onClick: () => void;
  active?: boolean;
}
export function ListItem(props: ListItemProps) {
  return (
    <li class="border-t last:border-b border-slate-400 flex">
      <button
        type="button"
        onClick={() => props.onClick()}
        class={clsx(
          'py-2 px-4 cursor-pointer hover:bg-slate-600 flex gap-2 flex-1 items-start overflow-hidden',
          { 'bg-slate-700': props.active },
        )}
      >
        <span class="flex-1 font-mono text-left overflow-hidden whitespace-nowrap text-ellipsis">
          {props.passageData.name}
        </span>
        <div class="flex gap-1">
          <For each={props.passageData.tags}>{(tag) => <Tag tag={tag} />}</For>
        </div>
      </button>
    </li>
  );
}

interface TagProps {
  tag: string;
}

const hashToHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360; // 0–360
};

const l = 0.45;
const c = 0.18;
function Tag(props: TagProps) {
  const hue = () => hashToHue(props.tag.toLowerCase());
  const bg = () => `oklch(${l} ${c} ${hue()}deg)`;

  return (
    <span
      class="inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
      style={{ 'background-color': bg() }}
    >
      {props.tag}
    </span>
  );
}

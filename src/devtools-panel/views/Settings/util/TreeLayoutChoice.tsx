import type { JSX } from '@solidjs/web';
import clsx from 'clsx';

import { getSettings, setSetting } from '@/devtools-panel/store/store';

type TreeLayout = ReturnType<typeof getSettings.state.treeLayout>;

interface PictogramRowProps {
  kind: 'container' | 'value';
  level: 0 | 1 | 2;
  width: number;
  isOpen?: boolean;
  isSelected?: boolean;
}

/** A row of a pictogram: a chevron, the icon of the type, a bar for the name */
function PictogramRow(props: PictogramRowProps) {
  return (
    <div
      class={clsx(
        'flex h-3 shrink-0 items-center gap-[3px] rounded-[3px] border pr-[3px]',
        props.isSelected ? 'border-sky-500 bg-sky-950' : 'border-transparent',
      )}
      style={{ 'padding-left': `${2 + props.level * 9}px` }}
    >
      <span class="w-[7px] text-center text-[7px] leading-none text-gray-400">
        {props.kind === 'container' ? (props.isOpen ? '▾' : '▸') : ''}
      </span>
      <span
        class={clsx(
          'h-[7px] w-[7px] shrink-0 rounded-xs',
          props.kind === 'container' ? 'bg-sky-400' : 'bg-amber-400',
        )}
      />
      <span class="h-[3px] rounded-xs bg-gray-500" style={{ width: `${props.width}px` }} />
    </div>
  );
}

const pictogramClass =
  'flex h-[82px] gap-1.5 overflow-hidden rounded-md border border-slate-700 bg-slate-950 p-1.5';

interface OptionProps {
  value: TreeLayout;
  title: string;
  description: string;
  pictogram: JSX.Element;
}

function Option(props: OptionProps) {
  return (
    <label class="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2.5 hover:border-slate-600 has-checked:border-sky-500 has-checked:bg-sky-950 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-sky-400">
      <input
        type="radio"
        name="tree-layout"
        class="sr-only"
        checked={getSettings.state.treeLayout() === props.value}
        onChange={() => setSetting('state.treeLayout', props.value)}
      />
      {props.pictogram}
      <span class="text-sm font-semibold">{props.title}</span>
      <span class="text-xs leading-snug text-gray-400">{props.description}</span>
    </label>
  );
}

/** The two layouts of the tree, each with a picture of what it looks like */
export function TreeLayoutChoice() {
  return (
    <div role="radiogroup" aria-label="Tree layout" class="grid grid-cols-2 gap-2.5">
      <Option
        value="containers-and-primitives"
        title="Everything in the tree"
        description="Containers and values are all rows of the tree."
        pictogram={
          <div aria-hidden="true" class={pictogramClass}>
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <PictogramRow kind="container" level={0} width={44} isOpen />
              <PictogramRow kind="container" level={1} width={30} />
              <PictogramRow kind="container" level={1} width={38} isOpen isSelected />
              <PictogramRow kind="value" level={2} width={34} />
              <PictogramRow kind="value" level={2} width={24} />
            </div>
          </div>
        }
      />
      <Option
        value="primitives-in-list"
        title="Containers, and a list"
        description="The tree has containers only. The values of the selected container are in a list beside it."
        pictogram={
          <div aria-hidden="true" class={pictogramClass}>
            <div class="flex min-w-0 flex-[1.25] flex-col gap-0.5">
              <PictogramRow kind="container" level={0} width={44} isOpen />
              <PictogramRow kind="container" level={1} width={30} />
              <PictogramRow kind="container" level={1} width={38} isOpen isSelected />
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-0.5 border-l border-slate-700 pl-1.5">
              <div class="mb-0.5 flex h-3 items-center border-b border-slate-700 pl-0.5">
                <span class="h-[3px] w-[34px] rounded-xs bg-gray-400" />
              </div>
              <PictogramRow kind="value" level={0} width={34} />
              <PictogramRow kind="value" level={0} width={24} />
              <PictogramRow kind="value" level={0} width={40} />
            </div>
          </div>
        }
      />
    </div>
  );
}

import { createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { getContainerSize, getJsonType, getPathValue, isContainer } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { ValueHeader } from '../ValueHeader/ValueHeader';
import { PropertyGrid } from './PropertyGrid';

interface Props {
  path: Path;
}

const buttonClass =
  'cursor-pointer rounded-md border border-gray-500 px-3 py-1 text-sm hover:bg-gray-700 disabled:cursor-default disabled:text-gray-500 disabled:hover:bg-transparent';

export function ContainerEditor(props: Props) {
  const getContainer = () => getPathValue(getLatestState(), props.path);
  const getType = createMemo(() => getJsonType(getContainer()));
  const getCount = () => {
    const container = getContainer();
    return isContainer(container) ? getContainerSize(container) : 0;
  };
  // Arrays and sets have items, and no names to give them
  const getAddLabel = () =>
    getType() === 'array' || getType() === 'set' ? 'Add item' : 'Add property';

  return (
    <div class="flex flex-col gap-3 p-3">
      <ValueHeader path={props.path}>
        <p class="text-xs text-gray-400">
          {getCount()} {getCount() === 1 ? 'entry' : 'entries'}
        </p>
      </ValueHeader>
      <div class="flex flex-wrap gap-2">
        <button type="button" class={buttonClass} disabled title="Not built yet">
          {getAddLabel()}
        </button>
        <button type="button" class={buttonClass} disabled title="Not built yet">
          Edit as JSON
        </button>
      </div>
      <PropertyGrid path={props.path} />
    </div>
  );
}

import { For, createMemo } from 'solid-js';

import { getLatestState } from '@/devtools-panel/store/game-state';
import { Dropdown } from '@/devtools-panel/ui/display/Dropdown';
import { sameItems } from '@/devtools-panel/utils/same-items';
import { getJsonType, getKeyLabel, getPathValue, isContainerType } from '@/shared/json-safe';
import type { Path } from '@/shared/shared-types';

import { getKeysByName } from '../logic/sort-keys';

interface Props {
  parentPath: Path;
  currentKey: string | number;
  name: string;
  onSelect: (path: Path) => void;
}

/** Opens below the crumb it belongs to (the `--crumb` anchor of `BreadcrumbItem`), aligned with its start */
export function SiblingMenu(props: Props) {
  return (
    <Dropdown
      trigger="▾"
      label={`Siblings of ${props.name}`}
      triggerClass="cursor-pointer pr-2 text-gray-400 hover:text-white"
      menuClass="[position-anchor:--crumb]"
    >
      {(close) => {
        const getParent = () => getPathValue(getLatestState(), props.parentPath);
        const getKeys = createMemo(() => getKeysByName(getParent()), { equals: sameItems });
        const getLabel = (key: string | number) => {
          const type = getJsonType(getParent());
          return String(isContainerType(type) ? getKeyLabel(type, key) : key);
        };

        return (
          <For each={getKeys()}>
            {(key) => (
              <button
                type="button"
                onClick={() => {
                  props.onSelect([...props.parentPath, key]);
                  close();
                }}
                class={[
                  'block w-full cursor-pointer rounded px-2 py-1 text-left font-mono text-xs hover:bg-gray-700',
                  key === props.currentKey ? 'text-sky-300' : 'text-gray-200',
                ]}
              >
                {getLabel(key)}
              </button>
            )}
          </For>
        );
      }}
    </Dropdown>
  );
}
